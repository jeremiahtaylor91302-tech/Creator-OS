import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPlatformConnectionsByUser } from "@/lib/connections";
import { detectFaceInThumbnail } from "@/lib/ai/thumbnail-face";
import { refreshYouTubeAccessToken } from "@/lib/oauth/youtube";
import {
  fetchYouTubeAnalyticsSnapshot,
  fetchYouTubeTopVideos,
  formatNumber,
  type YouTubeAnalyticsSnapshot,
  type YouTubeTopVideo,
} from "@/lib/analytics/youtube";

export default async function YouTubePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { connections } = await getPlatformConnectionsByUser(user.id);
  const youtubeConnection = connections.find((connection) => connection.platform === "youtube");

  if (!youtubeConnection || youtubeConnection.status !== "connected" || !youtubeConnection.access_token) {
    return (
      <div className="space-y-5">
        <section className="rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-6">
          <h1 className="text-2xl font-semibold">YouTube</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect YouTube on the Connections page to unlock channel analytics and top video insights.
          </p>
        </section>
      </div>
    );
  }

  let metricsError: string | null = null;
  let effectiveAccessToken = youtubeConnection.access_token;
  const now = new Date();

  const tokenExpired = youtubeConnection.token_expires_at
    ? new Date(youtubeConnection.token_expires_at).getTime() <= now.getTime()
    : false;

  if (tokenExpired && youtubeConnection.refresh_token) {
    try {
      const refreshed = await refreshYouTubeAccessToken(youtubeConnection.refresh_token);
      effectiveAccessToken = refreshed.access_token;
      const nextExpiryDate = new Date(now);
      nextExpiryDate.setSeconds(nextExpiryDate.getSeconds() + refreshed.expires_in);
      const nextExpiry = nextExpiryDate.toISOString();

      await supabase
        .from("platform_connections")
        .update({
          access_token: refreshed.access_token,
          token_expires_at: nextExpiry,
          last_error: null,
        })
        .eq("user_id", user.id)
        .eq("platform", "youtube");
    } catch {
      metricsError = "Your YouTube session expired. Reconnect to refresh analytics access.";
    }
  }

  let snapshot: YouTubeAnalyticsSnapshot = {
    subscribers: null,
    views: null,
    videos: null,
    channelTitle: null,
  };
  let topVideos: Awaited<ReturnType<typeof fetchYouTubeTopVideos>> = [];

  try {
    [snapshot, topVideos] = await Promise.all([
      fetchYouTubeAnalyticsSnapshot(effectiveAccessToken),
      fetchYouTubeTopVideos(effectiveAccessToken, 20),
    ]);
  } catch (error) {
    metricsError =
      error instanceof Error
        ? "Connected, but YouTube analytics could not be fetched. Try reconnecting your account."
        : "Connected, but YouTube analytics could not be fetched.";
  }

  const topVideoCards = topVideos.slice(0, 6);
  const recentVideos = [...topVideos]
    .sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);
  const topPerformers = [...topVideos].sort((a, b) => b.views - a.views).slice(0, 5);
  const analysis = buildVideoAnalysis(recentVideos, topPerformers);

  const faceDetectionVideos = dedupeById([...recentVideos, ...topPerformers]);
  const faceDetectionEntries = await Promise.all(
    faceDetectionVideos.map(async (video) => {
      const result = await detectFaceInThumbnail(video.thumbnailUrl);
      return {
        video,
        hasFace: result?.hasFace ?? null,
      };
    }),
  );

  const faceDetections = new Map(
    faceDetectionEntries.map((entry) => [entry.video.id, entry.hasFace]),
  );
  const faceRiskVideos = recentVideos.filter((video) => faceDetections.get(video.id) === false);
  const facePerformanceNote = buildFacePerformanceNote(
    faceDetectionVideos,
    faceDetections,
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Creator direction</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Music growth</p>
            <p className="text-sm text-muted-foreground">
              Story-driven artist content with repeatable weekly series.
            </p>
          </div>
          <Link
            href="/direction"
            className="rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open roadmap
          </Link>
        </div>
      </section>

      {metricsError && (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{metricsError}</span>
            <Link
              href="/oauth/youtube/start"
              className="rounded-md border border-rose-300/40 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20"
            >
              Reconnect YouTube
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Subscribers", value: formatNumber(snapshot.subscribers) },
          { label: "Total views", value: formatNumber(snapshot.views) },
          { label: "Published videos", value: formatNumber(snapshot.videos) },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border bg-surface-muted/70 p-5">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-xl font-semibold">Top-performing videos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ranked by view count from your most recent uploads.
        </p>

        <div className="mt-4 space-y-3">
          {topVideoCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No video stats available yet.</p>
          ) : (
            topVideoCards.map((video) => (
              <a
                key={video.id}
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface p-3 transition hover:border-accent/60 hover:bg-surface-muted"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={96}
                      height={56}
                      className="h-14 w-24 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="h-14 w-24 rounded-md border bg-surface" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{video.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {video.publishedAt
                        ? new Date(video.publishedAt).toLocaleDateString()
                        : "Unknown publish date"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{formatNumber(video.views)} views</span>
                  <span>{formatNumber(video.likes)} likes</span>
                  <span>{formatNumber(video.comments)} comments</span>
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-xl font-semibold">Video analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimated quality scores comparing your recent uploads to top performers.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {analysis.map((item) => (
            <article key={item.label} className="rounded-xl border bg-surface p-4">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Recent: <span className="text-foreground">{item.recentScore}%</span> · Top:{" "}
                <span className="text-foreground">{item.topScore}%</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Improvement opportunity:{" "}
                <span className="font-semibold text-foreground">{item.improvement}%</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{item.tip}</p>
            </article>
          ))}
        </div>

        <article className="mt-4 rounded-xl border bg-surface p-4">
          <p className="text-sm font-semibold">Face on camera signal</p>
          <p className="mt-2 text-xs text-muted-foreground">{facePerformanceNote}</p>

          {faceRiskVideos.length > 0 ? (
            <div className="mt-3 space-y-2">
              {faceRiskVideos.map((video) => (
                <a
                  key={video.id}
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:border-rose-400/50"
                >
                  Potential view risk: no clear face detected on thumbnail - {video.title}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No recent thumbnail risk flags detected.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}

type AnalysisRow = {
  label: string;
  recentScore: number;
  topScore: number;
  improvement: number;
  tip: string;
};

function buildVideoAnalysis(recent: YouTubeTopVideo[], top: YouTubeTopVideo[]) {
  const rows: AnalysisRow[] = [
    {
      label: "Setup",
      recentScore: scoreAverage(recent, scoreSetup),
      topScore: scoreAverage(top, scoreSetup),
      improvement: 0,
      tip: "Front-load hooks and frame stakes in first 10 seconds to sharpen setup.",
    },
    {
      label: "Lighting",
      recentScore: scoreAverage(recent, scoreLighting),
      topScore: scoreAverage(top, scoreLighting),
      improvement: 0,
      tip: "Use brighter key-light contrast and cleaner thumbnails for stronger click-through.",
    },
    {
      label: "Video length fit",
      recentScore: scoreAverage(recent, scoreLengthFit),
      topScore: scoreAverage(top, scoreLengthFit),
      improvement: 0,
      tip: "Match duration range of your best videos; trim dead air between sections.",
    },
    {
      label: "On-camera presence",
      recentScore: scoreAverage(recent, scorePresence),
      topScore: scoreAverage(top, scorePresence),
      improvement: 0,
      tip: "Increase direct-to-camera moments and ask for comments with specific prompts.",
    },
  ];

  return rows.map((row) => ({
    ...row,
    improvement: Math.max(0, row.topScore - row.recentScore),
  }));
}

function scoreAverage(
  videos: YouTubeTopVideo[],
  scorer: (video: YouTubeTopVideo) => number,
) {
  if (videos.length === 0) {
    return 0;
  }

  const total = videos.reduce((sum, video) => sum + scorer(video), 0);
  return Math.round(total / videos.length);
}

function scoreSetup(video: YouTubeTopVideo) {
  const engagement = (video.likes + video.comments) / Math.max(video.views, 1);
  const titleLengthScore = Math.max(0, 100 - Math.abs(video.title.length - 52));
  return clamp(Math.round(titleLengthScore * 0.55 + engagement * 1200 * 0.45));
}

function scoreLighting(video: YouTubeTopVideo) {
  const likeRate = video.likes / Math.max(video.views, 1);
  return clamp(Math.round(40 + likeRate * 3200));
}

function scoreLengthFit(video: YouTubeTopVideo) {
  const targetSeconds = 300;
  const deviation = Math.abs(video.durationSeconds - targetSeconds);
  return clamp(Math.round(100 - deviation / 5));
}

function scorePresence(video: YouTubeTopVideo) {
  const commentRate = video.comments / Math.max(video.views, 1);
  const likeRate = video.likes / Math.max(video.views, 1);
  return clamp(Math.round(35 + likeRate * 2600 + commentRate * 2800));
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function dedupeById(videos: YouTubeTopVideo[]) {
  const seen = new Set<string>();
  return videos.filter((video) => {
    if (seen.has(video.id)) {
      return false;
    }
    seen.add(video.id);
    return true;
  });
}

function buildFacePerformanceNote(
  videos: YouTubeTopVideo[],
  detections: Map<string, boolean | null>,
) {
  const withFace = videos.filter((video) => detections.get(video.id) === true);
  const withoutFace = videos.filter((video) => detections.get(video.id) === false);

  if (withFace.length === 0 || withoutFace.length === 0) {
    return "Face-on-camera analysis is still gathering enough contrast data. As more thumbnails are assessed, this will quantify face-forward performance impact.";
  }

  const faceAvg =
    withFace.reduce((sum, video) => sum + video.views, 0) / withFace.length;
  const noFaceAvg =
    withoutFace.reduce((sum, video) => sum + video.views, 0) / withoutFace.length;

  if (faceAvg <= noFaceAvg) {
    return "In your current sample, non-face thumbnails are not underperforming yet, but face-forward creative is still recommended for stronger identity and trust.";
  }

  const lift = Math.round(((faceAvg - noFaceAvg) / Math.max(noFaceAvg, 1)) * 100);
  return `Face-forward videos consistently outperform non-face content in your data (about ${lift}% higher average views).`;
}
