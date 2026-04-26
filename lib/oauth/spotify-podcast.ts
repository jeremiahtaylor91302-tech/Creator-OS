type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

type SpotifyProfileResponse = {
  id?: string;
  display_name?: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function buildSpotifyPodcastOAuthUrl(state: string, redirectUri: string) {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", requiredEnv("SPOTIFY_CLIENT_ID"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "user-read-email user-read-private");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeSpotifyPodcastCodeForTokens(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const clientId = requiredEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requiredEnv("SPOTIFY_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify token exchange failed: ${errorText}`);
  }

  return (await response.json()) as SpotifyTokenResponse;
}

export async function fetchSpotifyPodcastIdentity(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify profile lookup failed: ${errorText}`);
  }

  const payload = (await response.json()) as SpotifyProfileResponse;
  if (!payload.id) {
    throw new Error("No Spotify account identity was returned.");
  }

  return {
    accountId: payload.id,
    username: payload.display_name ?? payload.id,
  };
}
