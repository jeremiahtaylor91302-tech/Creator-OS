import { NextResponse } from "next/server";
import { resolveAppBaseUrlFromRequest } from "@/lib/app-base-url";
import { createClient } from "@/lib/supabase/server";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import {
  exchangeYouTubeCodeForTokens,
  fetchYouTubeChannelIdentity,
} from "@/lib/oauth/youtube";
import {
  exchangeSpotifyPodcastCodeForTokens,
  fetchSpotifyPodcastIdentity,
} from "@/lib/oauth/spotify-podcast";
import {
  exchangeTikTokCodeForTokens,
  fetchTikTokIdentity,
} from "@/lib/oauth/tiktok";

function isPlatform(value: string): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const { searchParams } = new URL(request.url);

  if (!isPlatform(provider)) {
    return NextResponse.redirect(new URL("/settings?error=Unknown%20platform", request.url));
  }

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

  if (provider !== "youtube" && provider !== "podcast" && provider !== "tiktok") {
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent(
          `${provider} OAuth callback is not configured yet.`,
        )}`,
        request.url,
      ),
    );
  }

  if (oauthError) {
    await supabase
      .from("platform_connections")
      .update({
        status: "failed",
        last_error: oauthError,
      })
      .eq("user_id", user.id)
      .eq("platform", provider);

    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(oauthError)}`, request.url),
    );
  }

  const { data: pendingConnection } = await supabase
    .from("platform_connections")
    .select("metadata")
    .eq("user_id", user.id)
    .eq("platform", provider)
    .maybeSingle();

  const expectedState =
    pendingConnection &&
    typeof pendingConnection.metadata === "object" &&
    pendingConnection.metadata &&
    "oauth_state" in pendingConnection.metadata
      ? String(pendingConnection.metadata.oauth_state)
      : null;

  if (!code || !state || !expectedState || state !== expectedState) {
    await supabase
      .from("platform_connections")
      .update({
        status: "failed",
        last_error: "Invalid OAuth callback state or missing code",
      })
      .eq("user_id", user.id)
      .eq("platform", provider);

    return NextResponse.redirect(
      new URL("/settings?error=OAuth%20callback%20failed", request.url),
    );
  }

  const redirectUri = `${resolveAppBaseUrlFromRequest(request)}/oauth/${provider}/callback`;
  const now = new Date();

  try {
    const tokens = await (provider === "youtube"
      ? exchangeYouTubeCodeForTokens(code, redirectUri)
      : provider === "podcast"
        ? exchangeSpotifyPodcastCodeForTokens(code, redirectUri)
        : exchangeTikTokCodeForTokens(code, redirectUri));
    let externalAccountId: string;
    let externalUsername: string;
    if (provider === "youtube") {
      const yt = await fetchYouTubeChannelIdentity(tokens.access_token);
      externalAccountId = yt.channelId;
      externalUsername = yt.username;
    } else if (provider === "podcast") {
      const spot = await fetchSpotifyPodcastIdentity(tokens.access_token);
      externalAccountId = spot.accountId;
      externalUsername = spot.username;
    } else {
      const tt = await fetchTikTokIdentity(tokens.access_token);
      externalAccountId = tt.accountId;
      externalUsername = tt.username;
    }
    const tokenExpiresAtDate = new Date(now);
    tokenExpiresAtDate.setSeconds(tokenExpiresAtDate.getSeconds() + tokens.expires_in);
    const tokenExpiresAt = tokenExpiresAtDate.toISOString();

    const { error } = await supabase
      .from("platform_connections")
      .update({
        status: "connected",
        external_account_id: externalAccountId,
        external_username: externalUsername,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: tokenExpiresAt,
        connected_at: now.toISOString(),
        last_error: null,
        metadata: {
          oauth_state: state,
          linked_via:
            provider === "youtube"
              ? "youtube_oauth"
              : provider === "podcast"
                ? "spotify_oauth"
                : "tiktok_oauth",
          token_type: tokens.token_type,
          scope: tokens.scope ?? null,
        },
      })
      .eq("user_id", user.id)
      .eq("platform", provider);

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth exchange failed";

    await supabase
      .from("platform_connections")
      .update({
        status: "failed",
        last_error: message,
      })
      .eq("user_id", user.id)
      .eq("platform", provider);

    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL("/settings?success=Connected", request.url));
}
