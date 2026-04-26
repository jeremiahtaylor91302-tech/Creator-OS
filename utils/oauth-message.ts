export function formatOAuthError(error: string | null) {
  if (!error) {
    return null;
  }

  if (
    error.includes("youtube.googleapis.com") ||
    error.includes("YouTube Data API v3 has not been used")
  ) {
    return "YouTube Data API is not enabled in your Google Cloud project yet. Enable it, wait a minute, then try connecting again.";
  }

  if (error.includes("Missing required env var")) {
    return "YouTube OAuth credentials are missing in .env.local.";
  }

  if (
    error.includes("redirect_uri_mismatch") ||
    error.includes("redirect_uri") && error.toLowerCase().includes("invalid")
  ) {
    return "Google OAuth redirect URI mismatch. In Google Cloud Console → Credentials → your OAuth client, add this exact Authorized redirect URI: https://YOUR_DOMAIN/oauth/google-calendar/callback (use your real APP_URL / production domain).";
  }

  if (error.includes("Calendar connect") || error.includes("google_calendar_connections")) {
    return error;
  }

  if (error.includes('invalid input value for enum platform_name: "podcast"')) {
    return "Podcast support needs a one-time Supabase enum update. Run: alter type platform_name add value if not exists 'podcast';";
  }

  if (error.includes("Podcasts requires a one-time database update")) {
    return error;
  }

  if (error.length > 220) {
    return "OAuth failed due to a provider configuration issue. Please check Google Cloud OAuth/API settings and try again.";
  }

  return error;
}

export function formatOAuthSuccess(success: string | null) {
  if (!success) {
    return null;
  }

  if (success.toLowerCase() === "connected") {
    return "Platform connected successfully.";
  }

  return success;
}
