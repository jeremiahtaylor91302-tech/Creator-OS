import type { NextResponse } from "next/server";

/** HttpOnly cookie holding the OAuth `state` for Google Calendar connect (survives DB race from duplicate Connect clicks). */
export const GOOGLE_CALENDAR_OAUTH_STATE_COOKIE = "gcoa_state";

export function googleCalendarOAuthStateCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 10 * 60,
  };
}

export function clearGoogleCalendarOAuthStateCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
