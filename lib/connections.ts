import { createClient } from "@/lib/supabase/server";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import type { PlatformConnection } from "@/types/connections";

function isPlatform(value: string): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

export async function getPlatformConnectionsByUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return {
    connections: (data ?? []).filter((row) =>
      isPlatform(row.platform),
    ) as PlatformConnection[],
    error: error?.message ?? null,
  };
}

export function getPlatformSetupHint(errorMessage: string | null) {
  if (!errorMessage) {
    return null;
  }

  if (
    errorMessage.includes("relation") &&
    errorMessage.includes("platform_connections")
  ) {
    return "The platform_connections table is missing. Run the Supabase migration to enable connection storage.";
  }

  return `Supabase query error: ${errorMessage}`;
}
