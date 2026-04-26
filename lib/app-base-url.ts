/**
 * Canonical site origin for OAuth redirect_uri / callback URLs.
 * Prefer APP_URL (server) or NEXT_PUBLIC_APP_URL so production matches Google Console, not an internal host.
 */
export function resolveAppBaseUrlFromRequest(request: Request): string {
  const configured = process.env.APP_URL?.trim() ?? process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
}
