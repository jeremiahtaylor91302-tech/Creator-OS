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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ connected: false, trackedHours: 0, trackedEvents: 0, publishingEvents: 0 });
  }

  const { data: connection } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!connection || connection.status !== "connected" || !connection.access_token) {
    return NextResponse.json({ connected: false, trackedHours: 0, trackedEvents: 0, publishingEvents: 0 });
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
      return NextResponse.json({ connected: false, trackedHours: 0, trackedEvents: 0, publishingEvents: 0 });
    }
  }

  try {
    const { timeMin, timeMax } = getWeekBounds();
    const stats = await fetchWeeklyCalendarStats(accessToken, timeMin, timeMax);
    return NextResponse.json({
      connected: true,
      ...stats,
    });
  } catch {
    return NextResponse.json({ connected: false, trackedHours: 0, trackedEvents: 0, publishingEvents: 0 });
  }
}
