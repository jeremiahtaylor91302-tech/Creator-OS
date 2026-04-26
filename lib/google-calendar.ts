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

/** Thrown when the Calendar API rejects the bearer token (often fixed by refreshing). */
export class GoogleCalendarApiError extends Error {
  readonly status: number;

  constructor(status: number, body: string) {
    super(`Google Calendar API error (${status}): ${body}`);
    this.name = "GoogleCalendarApiError";
    this.status = status;
  }
}

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

export type WeeklyCalendarScheduleItem = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  kind: "publish" | "production" | "editing" | "other";
  isContent: boolean;
};

export type WeeklyCalendarSnapshot = {
  stats: WeeklyCalendarStats;
  schedule: WeeklyCalendarScheduleItem[];
  contentDueByType: Array<{ type: string; count: number }>;
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
  const trimmed = refreshToken.trim();
  if (!trimmed) {
    throw new Error("Google token refresh failed: empty refresh_token");
  }

  const body = new URLSearchParams({
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    refresh_token: trimmed,
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
  const snapshot = await fetchWeeklyCalendarSnapshot(accessToken, timeMin, timeMax);
  return snapshot.stats;
}

function classifyEvent(summary: string, description: string): {
  kind: WeeklyCalendarScheduleItem["kind"];
  isContent: boolean;
  isPublishing: boolean;
} {
  const blob = `${summary} ${description}`.toLowerCase();
  const isContent = CONTENT_KEYWORDS.some((keyword) => blob.includes(keyword));

  if (blob.includes("publish") || blob.includes("upload") || blob.includes("post")) {
    return { kind: "publish", isContent, isPublishing: true };
  }
  if (
    blob.includes("film") ||
    blob.includes("record") ||
    blob.includes("shoot") ||
    blob.includes("youtube")
  ) {
    return { kind: "production", isContent, isPublishing: false };
  }
  if (blob.includes("edit") || blob.includes("editing")) {
    return { kind: "editing", isContent, isPublishing: false };
  }

  return { kind: "other", isContent, isPublishing: false };
}

export async function fetchWeeklyCalendarSnapshot(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<WeeklyCalendarSnapshot> {
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
    const body = await response.text();
    if (response.status === 401) {
      throw new GoogleCalendarApiError(401, body);
    }
    throw new Error(`Google Calendar events fetch failed: ${body}`);
  }

  const payload = (await response.json()) as GoogleEventsResponse;
  const items = payload.items ?? [];

  let trackedMinutes = 0;
  let trackedEvents = 0;
  let publishingEvents = 0;
  const schedule: WeeklyCalendarScheduleItem[] = [];
  const contentTypeCounts: Record<string, number> = {
    Publish: 0,
    Production: 0,
    Editing: 0,
    Other: 0,
  };

  for (let index = 0; index < items.length; index += 1) {
    const event = items[index];
    const summary = event.summary?.trim() ?? "Untitled event";
    const description = event.description?.trim() ?? "";
    const start = event.start?.dateTime ?? event.start?.date;
    const end = event.end?.dateTime ?? event.end?.date;
    if (!start || !end) continue;

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) continue;

    const minutes = Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60));
    const classification = classifyEvent(summary, description);

    schedule.push({
      id: `${startDate.toISOString()}-${index}`,
      title: summary,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      durationMinutes: Math.round(minutes),
      kind: classification.kind,
      isContent: classification.isContent,
    });

    if (classification.isContent) {
      trackedMinutes += minutes;
      trackedEvents += 1;
      if (classification.kind === "publish") contentTypeCounts.Publish += 1;
      else if (classification.kind === "production") contentTypeCounts.Production += 1;
      else if (classification.kind === "editing") contentTypeCounts.Editing += 1;
      else contentTypeCounts.Other += 1;
    }

    if (classification.isPublishing) {
      publishingEvents += 1;
    }
  }

  return {
    stats: {
      trackedHours: Number((trackedMinutes / 60).toFixed(2)),
      trackedEvents,
      publishingEvents,
    },
    schedule,
    contentDueByType: Object.entries(contentTypeCounts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ type, count })),
  };
}
