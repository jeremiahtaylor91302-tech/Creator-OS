"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isTrackingPlatform, type TrackingPlatform, TRACKING_PLATFORMS } from "@/lib/platforms";

export type UpdateTrackedPlatformsResult = { ok: true } | { ok: false; error: string };

export async function updateTrackedPlatforms(ids: string[]): Promise<UpdateTrackedPlatformsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to be signed in." };
  }

  const cleaned = [...new Set(ids.filter((id): id is TrackingPlatform => isTrackingPlatform(id)))];
  const ordered = TRACKING_PLATFORMS.filter((p) => cleaned.includes(p));

  if (ordered.length === 0) {
    return { ok: false, error: "Keep at least one platform enabled." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ tracked_platforms: ordered, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
