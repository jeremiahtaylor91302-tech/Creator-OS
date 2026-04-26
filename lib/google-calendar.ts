const CONTENT_KEYWORDS = [
  "content",
  "youtube",
  "tiktok",
  "instagram",
  "podcast",
  "film",
  "filming",
  "edit",
  "editing",
  "publish",
  "upload",
  "record",
  "shoot",
  "reel",
  "short",
  "post",
];

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

type GoogleEvent = {
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GoogleEventsResponse = {
  items?: GoogleEvent[];
};

export type WeeklyCalendarStats = {
  trackedHours: number;
  trackedEvents: number;
  publishingEvents: number;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getGoogleClientId() {
  return process.env.GOOGLE_OAUTH_CLIENT_ID ?? requiredEnv("YOUTUBE_CLIENT_ID");
}

function getGoogleClientSecret() {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? requiredEnv("YOUTUBE_CLIENT_SECRET");
}

export function buildGoogleCalendarOAuthUrl(state: string, redirectUri: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", getGoogleClientId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.readonly");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeGoogleCodeForTokens(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${await response.text()}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function fetchWeeklyCalendarStats(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<WeeklyCalendarStats> {
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google Calendar events fetch failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as GoogleEventsResponse;
  const items = payload.items ?? [];

  let trackedMinutes = 0;
  let trackedEvents = 0;
  let publishingEvents = 0;

  for (const event of items) {
    const summary = event.summary?.toLowerCase() ?? "";
    const description = event.description?.toLowerCase() ?? "";
    const blob = `${summary} ${description}`;
    const matches = CONTENT_KEYWORDS.some((keyword) => blob.includes(keyword));
    if (!matches) continue;

    const start = event.start?.dateTime ?? event.start?.date;
    const end = event.end?.dateTime ?? event.end?.date;
    if (!start || !end) continue;

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) continue;

    const minutes = Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60));
    trackedMinutes += minutes;
    trackedEvents += 1;

    if (summary.includes("publish") || summary.includes("upload") || summary.includes("post")) {
      publishingEvents += 1;
    }
  }

  return {
    trackedHours: Number((trackedMinutes / 60).toFixed(2)),
    trackedEvents,
    publishingEvents,
  };
}
