type YouTubeTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

type YouTubeChannelItem = {
  id: string;
  snippet?: {
    customUrl?: string;
    title?: string;
  };
};

type YouTubeChannelsResponse = {
  items?: YouTubeChannelItem[];
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function buildYouTubeOAuthUrl(state: string, redirectUri: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", requiredEnv("YOUTUBE_CLIENT_ID"));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.readonly");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeYouTubeCodeForTokens(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    code,
    client_id: requiredEnv("YOUTUBE_CLIENT_ID"),
    client_secret: requiredEnv("YOUTUBE_CLIENT_SECRET"),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube token exchange failed: ${errorText}`);
  }

  return (await response.json()) as YouTubeTokenResponse;
}

export async function refreshYouTubeAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: requiredEnv("YOUTUBE_CLIENT_ID"),
    client_secret: requiredEnv("YOUTUBE_CLIENT_SECRET"),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube token refresh failed: ${errorText}`);
  }

  return (await response.json()) as YouTubeTokenResponse;
}

export async function fetchYouTubeChannelIdentity(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube channel lookup failed: ${errorText}`);
  }

  const payload = (await response.json()) as YouTubeChannelsResponse;
  const firstChannel = payload.items?.[0];

  if (!firstChannel?.id) {
    throw new Error("No YouTube channel found for this account.");
  }

  return {
    channelId: firstChannel.id,
    username:
      firstChannel.snippet?.customUrl ??
      firstChannel.snippet?.title ??
      firstChannel.id,
  };
}
