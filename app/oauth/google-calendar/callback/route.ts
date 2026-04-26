import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeGoogleCodeForTokens } from "@/lib/google-calendar";

function resolveAppBaseUrl(request: Request) {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
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
    return NextResponse.redirect(new URL("/auth/sign-in?error=Please%20sign%20in", request.url));
  }

  if (oauthError) {
    await supabase
      .from("google_calendar_connections")
      .update({ status: "failed", last_error: oauthError })
      .eq("user_id", user.id);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(oauthError)}`, request.url),
    );
  }

  const { data: pending } = await supabase
    .from("google_calendar_connections")
    .select("oauth_state")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!code || !state || !pending?.oauth_state || state !== pending.oauth_state) {
    await supabase
      .from("google_calendar_connections")
      .update({ status: "failed", last_error: "Invalid OAuth callback state or missing code" })
      .eq("user_id", user.id);
    return NextResponse.redirect(new URL("/settings?error=OAuth%20callback%20failed", request.url));
  }

  const redirectUri = `${resolveAppBaseUrl(request)}/oauth/google-calendar/callback`;

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

    return NextResponse.redirect(
      new URL("/settings?success=Google%20Calendar%20connected", request.url),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Calendar OAuth failed";

    await supabase
      .from("google_calendar_connections")
      .update({ status: "failed", last_error: message })
      .eq("user_id", user.id);

    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
