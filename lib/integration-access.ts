import type { Platform } from "@/lib/platforms";

/** Account that can use draft platform OAuth (Instagram, X, Podcasts) before public release. */
export const INTEGRATION_PREVIEW_EMAIL = "jeremiahtaylor91302@gmail.com";

const COMING_SOON_PLATFORMS = new Set<Platform>(["instagram", "twitter", "podcast"]);

export function hasIntegrationPreviewAccess(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === INTEGRATION_PREVIEW_EMAIL.toLowerCase();
}

/** Non-preview users see a Coming soon state for these platforms (UI + OAuth start). */
export function platformIsComingSoonForUser(
  platform: Platform,
  email: string | undefined | null,
): boolean {
  return COMING_SOON_PLATFORMS.has(platform) && !hasIntegrationPreviewAccess(email);
}
