import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchWeeklyCalendarStats,
  refreshGoogleAccessToken,
} from "@/lib/google-calendar";

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);

  return {
    timeMin: monday.toISOString(),
    timeMax: sunday.toISOString(),
  };
}

function emptyStats(connected: boolean, budgetHours: number, calendarStatsUnavailable: boolean) {
  return {
    connected,
    budgetHours,
    trackedHours: 0,
    trackedEvents: 0,
    publishingEvents: 0,
    calendarStatsUnavailable,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let budgetHours = 2;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("weekly_time_budget_hours")
      .eq("id", user.id)
      .maybeSingle();
    const rawBudget = profile?.weekly_time_budget_hours;
    if (typeof rawBudget === "number" && Number.isFinite(rawBudget) && rawBudget >= 0.5) {
      budgetHours = rawBudget;
    }
  }

  if (!user) {
    return NextResponse.json(emptyStats(false, budgetHours, false));
  }

  const { data: connection } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !connection ||
    String(connection.status) !== "connected" ||
    !connection.access_token
  ) {
    return NextResponse.json(emptyStats(false, budgetHours, false));
  }

  let accessToken = connection.access_token as string;
  const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at as string) : null;
  const tokenExpired = tokenExpiresAt ? tokenExpiresAt.getTime() < Date.now() : false;

  if (tokenExpired && connection.refresh_token) {
    try {
      const refreshed = await refreshGoogleAccessToken(connection.refresh_token as string);
      accessToken = refreshed.access_token;
      const nextExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      await supabase
        .from("google_calendar_connections")
        .update({
          access_token: refreshed.access_token,
          token_expires_at: nextExpiry,
        })
        .eq("user_id", user.id);
    } catch {
      return NextResponse.json({
        ...emptyStats(true, budgetHours, true),
        lastCalendarError: "Could not refresh Google Calendar token.",
      });
    }
  }

  if (tokenExpired && !connection.refresh_token) {
    return NextResponse.json({
      ...emptyStats(true, budgetHours, true),
      lastCalendarError: "Google Calendar session expired. Reconnect in Settings.",
    });
  }

  try {
    const { timeMin, timeMax } = getWeekBounds();
    const stats = await fetchWeeklyCalendarStats(accessToken, timeMin, timeMax);
    return NextResponse.json({
      connected: true,
      budgetHours,
      calendarStatsUnavailable: false,
      ...stats,
    });
  } catch {
    return NextResponse.json({
      ...emptyStats(true, budgetHours, true),
      lastCalendarError: "Could not load calendar events this week.",
    });
  }
}
