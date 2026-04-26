import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchWeeklyCalendarSnapshot,
  GoogleCalendarApiError,
  refreshGoogleAccessToken,
} from "@/lib/google-calendar";

const REFRESH_BUFFER_MS = 120_000;

async function persistRefreshedTokens(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  refreshed: Awaited<ReturnType<typeof refreshGoogleAccessToken>>,
) {
  const nextExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  const patch: Record<string, string> = {
    access_token: refreshed.access_token,
    token_expires_at: nextExpiry,
  };
  if (typeof refreshed.refresh_token === "string" && refreshed.refresh_token.trim().length > 0) {
    patch.refresh_token = refreshed.refresh_token.trim();
  }
  await supabase.from("google_calendar_connections").update(patch).eq("user_id", userId);
}

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
    contentDueByType: [] as Array<{ type: string; count: number }>,
    schedule: [] as Array<{
      id: string;
      title: string;
      startsAt: string;
      endsAt: string;
      durationMinutes: number;
      kind: "publish" | "production" | "editing" | "other";
      isContent: boolean;
    }>,
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

  const refreshTokenRaw = connection.refresh_token;
  const refreshToken =
    typeof refreshTokenRaw === "string" && refreshTokenRaw.trim().length > 0
      ? refreshTokenRaw.trim()
      : null;

  let accessToken = String(connection.access_token).trim();
  const tokenExpiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at as string)
    : null;
  const tokenExpired = tokenExpiresAt ? tokenExpiresAt.getTime() < Date.now() : false;
  const tokenExpiringSoon = tokenExpiresAt
    ? tokenExpiresAt.getTime() < Date.now() + REFRESH_BUFFER_MS
    : false;
  const shouldProactivelyRefresh =
    Boolean(refreshToken) && (tokenExpired || tokenExpiringSoon);

  if (shouldProactivelyRefresh) {
    try {
      const refreshed = await refreshGoogleAccessToken(refreshToken as string);
      accessToken = refreshed.access_token;
      await persistRefreshedTokens(supabase, user.id, refreshed);
    } catch {
      if (tokenExpired) {
        return NextResponse.json({
          ...emptyStats(true, budgetHours, true),
          lastCalendarError: "Could not refresh Google Calendar token.",
        });
      }
      // Still within Google's clock window — try the existing access token below.
    }
  }

  if (tokenExpired && !refreshToken) {
    return NextResponse.json({
      ...emptyStats(true, budgetHours, true),
      lastCalendarError: "Google Calendar session expired. Reconnect in Settings.",
    });
  }

  const { timeMin, timeMax } = getWeekBounds();

  try {
    const snapshot = await fetchWeeklyCalendarSnapshot(accessToken, timeMin, timeMax);
    return NextResponse.json({
      connected: true,
      budgetHours,
      calendarStatsUnavailable: false,
      ...snapshot.stats,
      contentDueByType: snapshot.contentDueByType,
      schedule: snapshot.schedule,
    });
  } catch (error) {
    if (error instanceof GoogleCalendarApiError && error.status === 401 && refreshToken) {
      try {
        const refreshed = await refreshGoogleAccessToken(refreshToken);
        accessToken = refreshed.access_token;
        await persistRefreshedTokens(supabase, user.id, refreshed);
        const snapshot = await fetchWeeklyCalendarSnapshot(accessToken, timeMin, timeMax);
        return NextResponse.json({
          connected: true,
          budgetHours,
          calendarStatsUnavailable: false,
          ...snapshot.stats,
          contentDueByType: snapshot.contentDueByType,
          schedule: snapshot.schedule,
        });
      } catch {
        return NextResponse.json({
          ...emptyStats(true, budgetHours, true),
          lastCalendarError: "Could not refresh Google Calendar token.",
        });
      }
    }

    return NextResponse.json({
      ...emptyStats(true, budgetHours, true),
      lastCalendarError: "Could not load calendar events this week.",
    });
  }
}
