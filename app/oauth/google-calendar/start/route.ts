import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleCalendarOAuthUrl } from "@/lib/google-calendar";

function createState() {
  return `google-calendar:${crypto.randomUUID()}`;
}

function resolveAppBaseUrl(request: Request) {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
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
  const callbackUrl = `${resolveAppBaseUrl(request)}/oauth/google-calendar/callback`;

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
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Calendar OAuth is not configured.";
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
