import { NextResponse } from "next/server";
import { resolveAppBaseUrlFromRequest } from "@/lib/app-base-url";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleCalendarOAuthUrl } from "@/lib/google-calendar";
import {
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
  googleCalendarOAuthStateCookieOptions,
} from "@/lib/google-calendar-oauth-state";

function createState() {
  return `google-calendar:${crypto.randomUUID()}`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=Please%20sign%20in", request.url));
  }

  const state = createState();
  const callbackUrl = `${resolveAppBaseUrlFromRequest(request)}/oauth/google-calendar/callback`;

  const { error: upsertError } = await supabase.from("google_calendar_connections").upsert(
    {
      user_id: user.id,
      status: "pending",
      oauth_state: state,
      last_error: null,
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent(
          `Could not start Calendar connect: ${upsertError.message}. If this persists, confirm the google_calendar_connections table exists in Supabase.`,
        )}`,
        request.url,
      ),
    );
  }

  try {
    const authorizationUrl = buildGoogleCalendarOAuthUrl(state, callbackUrl);
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, state, googleCalendarOAuthStateCookieOptions());
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Calendar OAuth is not configured.";
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
