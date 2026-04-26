import { createClient } from "@/lib/supabase/server";
import { getPlatformConnectionsByUser } from "@/lib/connections";
import { parseTrackedPlatformsFromDb } from "@/lib/platforms";

const FUNCTIONAL_PLATFORMS = new Set(["youtube", "tiktok", "instagram", "twitter"]);

type OnboardingProfileRow = {
  onboarding_completed: boolean | null;
  onboarding_step_platform: boolean | null;
  onboarding_step_direction: boolean | null;
  onboarding_step_idea: boolean | null;
  onboarding_step_explore: boolean | null;
  creator_goal: string | null;
  tracked_platforms: unknown;
  onboarding_dashboard_visits: number | null;
  onboarding_dashboard_seconds: number | null;
};

/**
 * Recomputes onboarding step flags from live data + profile counters, then sets
 * `onboarding_completed` when all four steps are satisfied.
 */
export async function syncOnboardingCompletionState(userId: string) {
  const supabase = await createClient();

  const { data: profileRaw, error: profileError } = await supabase
    .from("profiles")
    .select(
      [
        "onboarding_completed",
        "onboarding_step_platform",
        "onboarding_step_direction",
        "onboarding_step_idea",
        "onboarding_step_explore",
        "creator_goal",
        "tracked_platforms",
        "onboarding_dashboard_visits",
        "onboarding_dashboard_seconds",
      ].join(", "),
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profileRaw) {
    return;
  }

  const profile = profileRaw as unknown as OnboardingProfileRow;

  if (profile.onboarding_completed) {
    return;
  }

  const { connections } = await getPlatformConnectionsByUser(userId);
  const tracked = new Set(parseTrackedPlatformsFromDb(profile.tracked_platforms));

  const hasFunctionalConnection = connections.some(
    (conn) =>
      conn.status === "connected" &&
      FUNCTIONAL_PLATFORMS.has(conn.platform) &&
      tracked.has(conn.platform),
  );

  const goalText = typeof profile.creator_goal === "string" ? profile.creator_goal.trim() : "";
  const directionDone = goalText.length > 0;

  const visits = Number(profile.onboarding_dashboard_visits) || 0;
  const seconds = Number(profile.onboarding_dashboard_seconds) || 0;
  const exploreDone =
    Boolean(profile.onboarding_step_explore) || visits >= 2 || seconds >= 60;

  const ideaDone = Boolean(profile.onboarding_step_idea);

  const platformDone = hasFunctionalConnection;
  const allDone = platformDone && directionDone && exploreDone && ideaDone;

  await supabase
    .from("profiles")
    .update({
      onboarding_step_platform: platformDone,
      onboarding_step_direction: directionDone,
      onboarding_step_explore: exploreDone,
      onboarding_completed: allDone,
    })
    .eq("id", userId);
}
