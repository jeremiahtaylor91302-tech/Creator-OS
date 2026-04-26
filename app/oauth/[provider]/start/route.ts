import { NextResponse } from "next/server";
import { resolveAppBaseUrlFromRequest } from "@/lib/app-base-url";
import { createClient } from "@/lib/supabase/server";
import { platformIsComingSoonForUser } from "@/lib/integration-access";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { buildYouTubeOAuthUrl } from "@/lib/oauth/youtube";
import { buildSpotifyPodcastOAuthUrl } from "@/lib/oauth/spotify-podcast";
import { buildTikTokOAuthUrl } from "@/lib/oauth/tiktok";

function isPlatform(value: string): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

function createState(platform: Platform) {
  return `${platform}:${crypto.randomUUID()}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;

  if (!isPlatform(provider)) {
    return NextResponse.redirect(new URL("/settings?error=Unknown%20platform", request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=Please%20sign%20in", request.url));
  }

  if (platformIsComingSoonForUser(provider, user.email)) {
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent("This platform connection is coming soon.")}`,
        request.url,
      ),
    );
  }

  const state = createState(provider);
  const callbackUrl = `${resolveAppBaseUrlFromRequest(request)}/oauth/${provider}/callback`;

  if (provider !== "youtube" && provider !== "podcast" && provider !== "tiktok") {
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent(
          `${provider} OAuth is not configured yet.`,
        )}`,
        request.url,
      ),
    );
  }

  const { error } = await supabase.from("platform_connections").upsert(
    {
      user_id: user.id,
      platform: provider,
      status: "pending",
      metadata: { oauth_state: state, requested_at: new Date().toISOString() },
    },
    { onConflict: "user_id,platform" },
  );

  if (error) {
    const message =
      provider === "podcast" &&
      error.message.includes('invalid input value for enum platform_name: "podcast"')
        ? "Podcasts requires a one-time database update. Run: alter type platform_name add value if not exists 'podcast';"
        : error.message;
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }

  try {
    const authorizationUrl =
      provider === "youtube"
        ? buildYouTubeOAuthUrl(state, callbackUrl)
        : provider === "podcast"
          ? buildSpotifyPodcastOAuthUrl(state, callbackUrl)
          : buildTikTokOAuthUrl(state, callbackUrl);
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : provider === "podcast"
          ? "Podcast OAuth is not configured."
          : provider === "tiktok"
            ? "TikTok OAuth is not configured."
          : "YouTube OAuth is not configured.";
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
