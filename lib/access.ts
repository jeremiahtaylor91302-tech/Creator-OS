import { createClient } from "@/lib/supabase/server";

const DEFAULT_OWNER_EMAILS = ["jeremiahtaylor91302@gmail.com"];

function getOwnerEmails() {
  const configured = process.env.OWNER_EMAILS ?? "";
  const fromEnv = configured
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_OWNER_EMAILS, ...fromEnv]);
}

export function isOwnerEmail(email: string | null | undefined) {
  if (!email) return false;
  return getOwnerEmails().has(email.toLowerCase());
}

export async function hasLifetimeAccess(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_access")
    .select("lifetime_access")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data?.lifetime_access);
}

export async function canAccessApp(userId: string, email: string | null | undefined) {
  if (isOwnerEmail(email)) {
    return true;
  }
  return hasLifetimeAccess(userId);
}
