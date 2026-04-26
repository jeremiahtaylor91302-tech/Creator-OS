import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getPlatformConnectionsByUser,
  getPlatformSetupHint,
} from "@/lib/connections";
import { PLATFORMS } from "@/lib/platforms";
import { DashboardWorkbench } from "@/components/dashboard-workbench";
import { PlatformConnectionCard } from "@/components/platform-connection-card";
import { fetchYouTubeTopVideos } from "@/lib/analytics/youtube";
import { CalendarProductionProgress } from "@/components/calendar-production-progress";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { connections, error } = await getPlatformConnectionsByUser(user.id);
  const connectionMap = new Map(connections.map((conn) => [conn.platform, conn]));
  const connectedCount = connections.filter((conn) => conn.status === "connected").length;
  const setupHint = getPlatformSetupHint(error);
  const youtubeConnection = connectionMap.get("youtube");
  let latestPostedAt: string | null = null;

  if (youtubeConnection?.status === "connected" && youtubeConnection.access_token) {
    try {
      const videos = await fetchYouTubeTopVideos(youtubeConnection.access_token, 12);
      const newest = [...videos]
        .map((video) => video.publishedAt)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
      latestPostedAt = newest ?? null;
    } catch {
      latestPostedAt = null;
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Creator OS</p>
        <h1 className="mt-2 text-2xl font-semibold">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You have {connectedCount} connected platform
          {connectedCount === 1 ? "" : "s"}.
        </p>
      </section>
      {setupHint && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {setupHint}
        </section>
      )}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {PLATFORMS.map((platform) => {
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
          return (
            <PlatformConnectionCard
              key={platform}
              platform={platform}
              status={status}
              handle={connection?.external_username ?? null}
              actionHref={actionHref}
              actionLabel={actionLabel}
            />
          );
        })}
      </section>

      <DashboardWorkbench latestPostedAt={latestPostedAt} />
      <CalendarProductionProgress />

      <Link
        href="/settings"
        className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
      >
        Open Settings
      </Link>
    </div>
  );
}
