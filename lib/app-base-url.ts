import { headers } from "next/headers";

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

/**
 * Same rules as {@link resolveAppBaseUrlFromRequest}, for Server Actions where there is no Request.
 * If you sign up on localhost without APP_URL set, confirmation emails use localhost (expected).
 * Set APP_URL to your live origin (e.g. in Vercel env) so production signups never depend on a wrong host.
 */
export async function resolveAppBaseUrlFromServerHeaders(): Promise<string> {
  const configured = process.env.APP_URL?.trim() ?? process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const h = await headers();
  const origin = h.get("origin")?.replace(/\/+$/, "");
  if (origin) {
    return origin;
  }

  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host");
  if (host) {
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
      return `http://${host}`.replace(/\/+$/, "");
    }
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    return `${proto}://${host}`.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}
