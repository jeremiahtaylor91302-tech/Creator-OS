import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveAppBaseUrlFromRequest } from "@/lib/app-base-url";
import { createClient } from "@/lib/supabase/server";
import { exchangeGoogleCodeForTokens } from "@/lib/google-calendar";
import {
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
  clearGoogleCalendarOAuthStateCookie,
} from "@/lib/google-calendar-oauth-state";

function redirectWithClearedState(request: Request, pathname: string) {
  const url = pathname.startsWith("http") ? new URL(pathname) : new URL(pathname, request.url);
  const response = NextResponse.redirect(url);
  clearGoogleCalendarOAuthStateCookie(response);
  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithClearedState(request, "/auth/sign-in?error=Please%20sign%20in");
  }

  if (oauthError) {
    await supabase
      .from("google_calendar_connections")
      .update({ status: "failed", last_error: oauthError })
      .eq("user_id", user.id);
    return redirectWithClearedState(
      request,
      `/settings?error=${encodeURIComponent(oauthError)}`,
    );
  }

  const cookieStore = await cookies();
  const cookieState = cookieStore.get(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE)?.value;

  const { data: pending, error: pendingError } = await supabase
    .from("google_calendar_connections")
    .select("oauth_state")
    .eq("user_id", user.id)
    .maybeSingle();

  if (pendingError) {
    await supabase
      .from("google_calendar_connections")
      .update({ status: "failed", last_error: pendingError.message })
      .eq("user_id", user.id);
    return redirectWithClearedState(
      request,
      `/settings?error=${encodeURIComponent(`Calendar connect: ${pendingError.message}`)}`,
    );
  }

  const stateOk =
    Boolean(state) && (state === cookieState || state === pending?.oauth_state);

  if (!code || !stateOk) {
    const lastError = !code
      ? "Missing authorization code from Google"
      : !state
        ? "Missing OAuth state from Google"
        : !cookieState && !pending?.oauth_state
          ? "No pending Calendar connect session—start from Settings and complete Google in the same browser"
          : "OAuth state mismatch (often opening Connect twice or multiple tabs). Close extra tabs and try Connect once.";
    const queryError =
      "Google Calendar connect was interrupted. Close other Creator OS tabs, open Settings, and click Connect once—then finish the Google screen without starting another connect.";

    await supabase
      .from("google_calendar_connections")
      .update({ status: "failed", last_error: lastError })
      .eq("user_id", user.id);
    return redirectWithClearedState(
      request,
      `/settings?error=${encodeURIComponent(queryError)}`,
    );
  }

  const redirectUri = `${resolveAppBaseUrlFromRequest(request)}/oauth/google-calendar/callback`;

  try {
    const tokens = await exchangeGoogleCodeForTokens(code, redirectUri);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase.from("google_calendar_connections").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: tokenExpiresAt,
        scope: tokens.scope ?? null,
        status: "connected",
        connected_at: new Date().toISOString(),
        oauth_state: state,
        last_error: null,
      },
      { onConflict: "user_id" },
    );

    return redirectWithClearedState(request, "/settings?success=Google%20Calendar%20connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Calendar OAuth failed";

    await supabase
      .from("google_calendar_connections")
      .update({ status: "failed", last_error: message })
      .eq("user_id", user.id);

    return redirectWithClearedState(
      request,
      `/settings?error=${encodeURIComponent(message)}`,
    );
  }
}
