export const PLATFORMS = [
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
  "podcast",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  twitter: "Twitter/X",
  podcast: "Podcasts",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "bg-red-500/20 text-red-200",
  tiktok: "bg-slate-500/20 text-slate-200",
  instagram: "bg-pink-500/20 text-pink-200",
  twitter: "bg-blue-500/20 text-blue-200",
  podcast: "bg-amber-500/20 text-amber-200",
};
