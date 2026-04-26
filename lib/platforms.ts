/** Platforms with OAuth / `platform_connections` rows today. */
export const PLATFORMS = [
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
  "podcast",
] as const;

export type Platform = (typeof PLATFORMS)[number];

/** All channels users can opt into tracking in Settings (includes future integrations). */
export const TRACKING_PLATFORMS = [
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
  "podcast",
  "pinterest",
  "substack",
] as const;

export type TrackingPlatform = (typeof TRACKING_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  twitter: "Twitter/X",
  podcast: "Podcasts",
};

export const TRACKING_PLATFORM_LABELS: Record<TrackingPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  twitter: "Twitter/X",
  podcast: "Podcasts",
  pinterest: "Pinterest",
  substack: "Substack",
};

/** Short benefit line for OAuth platforms (Settings + connection cards). */
export const PLATFORM_OAUTH_BENEFIT_LINES: Partial<Record<Platform, string>> = {
  youtube: "Track subscribers, views, and which videos are driving growth.",
  tiktok: "See what's blowing up — views, likes, and follower trends.",
  instagram: "Monitor your reach, reels performance, and audience growth.",
  twitter: "Track impressions, engagement, and what's resonating.",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "bg-red-500/20 text-red-200",
  tiktok: "bg-slate-500/20 text-slate-200",
  instagram: "bg-pink-500/20 text-pink-200",
  twitter: "bg-blue-500/20 text-blue-200",
  podcast: "bg-amber-500/20 text-amber-200",
};

export function isPlatform(value: string): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

export function isTrackingPlatform(value: string): value is TrackingPlatform {
  return TRACKING_PLATFORMS.includes(value as TrackingPlatform);
}

/** Default when DB value is missing or invalid (Pinterest & Substack off until toggled). */
export const DEFAULT_TRACKED_PLATFORMS: TrackingPlatform[] = [
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
  "podcast",
];

/** Parse `profiles.tracked_platforms` with stable canonical ordering. */
export function parseTrackedPlatformsFromDb(value: unknown): TrackingPlatform[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [...DEFAULT_TRACKED_PLATFORMS];
  }
  const picked = value.filter((v): v is TrackingPlatform => typeof v === "string" && isTrackingPlatform(v));
  const unique = [...new Set(picked)];
  const ordered = TRACKING_PLATFORMS.filter((p) => unique.includes(p));
  return ordered.length > 0 ? ordered : [...DEFAULT_TRACKED_PLATFORMS];
}
