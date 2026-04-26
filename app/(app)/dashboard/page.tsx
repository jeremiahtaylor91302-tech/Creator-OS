import { createClient } from "@/lib/supabase/server";
import { getPlatformConnectionsByUser, getPlatformSetupHint } from "@/lib/connections";
import { platformIsComingSoonForUser } from "@/lib/integration-access";
import { isCreatorPreviewEligible } from "@/lib/creator-preview-eligibility";
import { syncOnboardingCompletionState } from "@/lib/onboarding";
import { DashboardWorkbench } from "@/components/dashboard-workbench";
import {
  DashboardOnboardingChecklist,
  type OnboardingStepState,
} from "@/components/dashboard-onboarding";
import { DashboardMainOverview } from "@/components/dashboard-main-overview";
import { DashboardNewUserPreviewBar } from "@/components/dashboard-new-user-preview-bar";
import { PlatformConnectionCard } from "@/components/platform-connection-card";
import { isPlatform, parseTrackedPlatformsFromDb, TRACKING_PLATFORMS } from "@/lib/platforms";

type DashboardProfileRow = {
  tracked_platforms: unknown;
  onboarding_completed: boolean | null;
  onboarding_step_platform: boolean | null;
  onboarding_step_direction: boolean | null;
  onboarding_step_idea: boolean | null;
  onboarding_step_explore: boolean | null;
  creator_goal: string | null;
  onboarding_dashboard_visits: number | null;
  onboarding_dashboard_seconds: number | null;
};

const ACTIVE_PLATFORM_IDS = new Set(["youtube", "tiktok", "instagram", "twitter"]);

const PROFILE_ONBOARDING_FIELDS = [
  "tracked_platforms",
  "onboarding_completed",
  "onboarding_step_platform",
  "onboarding_step_direction",
  "onboarding_step_idea",
  "onboarding_step_explore",
  "creator_goal",
  "onboarding_dashboard_visits",
  "onboarding_dashboard_seconds",
].join(", ");

type DashboardSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage(props: { searchParams: DashboardSearchParams }) {
  const searchParams = await props.searchParams;
  const newUserPreviewRaw = searchParams.newUserPreview;
  const newUserPreview =
    newUserPreviewRaw === "1" || newUserPreviewRaw === "true" || newUserPreviewRaw === "yes";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const showPreviewToggle = isCreatorPreviewEligible(user.email ?? undefined);
  const newUserPreviewActive = showPreviewToggle && newUserPreview;

  const { connections, error } = await getPlatformConnectionsByUser(user.id);
  const connectionMap = new Map(connections.map((conn) => [conn.platform, conn]));
  const setupHint = getPlatformSetupHint(error);

  await syncOnboardingCompletionState(user.id);

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select(PROFILE_ONBOARDING_FIELDS)
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRaw as unknown as DashboardProfileRow | null;

  const trackedPlatforms = parseTrackedPlatformsFromDb(profile?.tracked_platforms);
  const trackedSet = new Set(trackedPlatforms);
  const visibleTrackingIds = TRACKING_PLATFORMS.filter(
    (id) => trackedSet.has(id) && id !== "podcast",
  );

  const connectedCount = connections.filter(
    (conn) =>
      conn.status === "connected" &&
      trackedSet.has(conn.platform) &&
      ACTIVE_PLATFORM_IDS.has(conn.platform),
  ).length;

  const onboardingCompleted = Boolean(profile?.onboarding_completed);

  const stepPlatform = Boolean(profile?.onboarding_step_platform);
  const stepDirection = Boolean(profile?.onboarding_step_direction);
  const stepIdea = Boolean(profile?.onboarding_step_idea);
  const stepExplore = Boolean(profile?.onboarding_step_explore);

  const onboardingCompletedUi = newUserPreviewActive ? false : onboardingCompleted;
  const connectedCountUi = newUserPreviewActive ? 0 : connectedCount;

  const checklistSteps: OnboardingStepState[] = [
    {
      id: "platform",
      title: "Connect your first platform",
      description: "Link where you already post so everything lives in one calm place.",
      href: "/settings",
      done: newUserPreviewActive ? false : stepPlatform,
    },
    {
      id: "direction",
      title: "Set your direction",
      description: "Tell us your goal once — we will shape ideas around what you actually want.",
      href: "/direction",
      done: newUserPreviewActive ? false : stepDirection,
    },
    {
      id: "idea",
      title: "Submit your first content idea",
      description: "Drop one rough idea into the cooker. Messy is fine; that is where the good stuff starts.",
      href: "#idea-pressure-cooker",
      done: newUserPreviewActive ? false : stepIdea,
    },
    {
      id: "explore",
      title: "Explore your dashboard",
      description: "Click around, breathe — when you have been here twice or a minute, we will tick this for you.",
      href: "#dashboard-onboarding",
      done: newUserPreviewActive ? false : stepExplore,
    },
  ];

  const completedCount = checklistSteps.filter((s) => s.done).length;
  const onboardingNextStep = checklistSteps.find((step) => !step.done) ?? null;

  return (
    <div className="space-y-5">
      {showPreviewToggle ? (
        <DashboardNewUserPreviewBar defaultActive={newUserPreviewActive} />
      ) : null}

      {!onboardingCompletedUi ? (
        <div id="dashboard-onboarding">
          <DashboardOnboardingChecklist
            steps={checklistSteps}
            completedCount={completedCount}
            pauseProgressTracking={newUserPreviewActive}
          />
        </div>
      ) : null}

      <DashboardMainOverview
        onboardingCompleted={onboardingCompletedUi}
        onboardingNextStep={onboardingNextStep}
        activePlatforms={connectedCountUi}
        totalPlatforms={ACTIVE_PLATFORM_IDS.size}
        newUserPreview={newUserPreviewActive}
      />

      {setupHint && !newUserPreviewActive ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {setupHint}
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Platform connections</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect the channels you track — each one shows what you&apos;ll get once it&apos;s linked.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {visibleTrackingIds.map((platform) => {
            if (!isPlatform(platform)) {
              return (
                <PlatformConnectionCard
                  key={platform}
                  platform={platform}
                  status="not connected"
                  handle={null}
                  actionHref="/settings"
                  actionLabel="Connect"
                  comingSoon
                />
              );
            }

            if (newUserPreviewActive) {
              const oauthComingSoon = platformIsComingSoonForUser(platform, user.email);
              return (
                <PlatformConnectionCard
                  key={platform}
                  platform={platform}
                  status="not connected"
                  handle={null}
                  actionHref={`/oauth/${platform}/start`}
                  actionLabel="Connect"
                  comingSoon={oauthComingSoon}
                />
              );
            }

            const connection = connectionMap.get(platform);
            const status = connection?.status ?? "not connected";
            const isConnected = connection?.status === "connected";
            const actionHref = isConnected
              ? platform === "youtube"
                ? "/youtube"
                : `/oauth/${platform}/start`
              : `/oauth/${platform}/start`;
            const actionLabel = isConnected
              ? platform === "youtube"
                ? "Open"
                : "Reconnect"
              : "Connect";
            const oauthComingSoon = platformIsComingSoonForUser(platform, user.email);

            return (
              <PlatformConnectionCard
                key={platform}
                platform={platform}
                status={status}
                handle={connection?.external_username ?? null}
                actionHref={actionHref}
                actionLabel={actionLabel}
                comingSoon={oauthComingSoon}
              />
            );
          })}
        </div>
      </section>

      <DashboardWorkbench
        latestPostedAt={null}
        suppressInactivityAlert={!onboardingCompletedUi}
      />
    </div>
  );
}
