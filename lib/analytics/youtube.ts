type YouTubeChannelStatsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
    };
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
    statistics?: {
      subscriberCount?: string;
      viewCount?: string;
      videoCount?: string;
    };
  }>;
};

type YouTubePlaylistItemsResponse = {
  items?: Array<{
    contentDetails?: {
      videoId?: string;
      videoPublishedAt?: string;
    };
    snippet?: {
      title?: string;
      thumbnails?: {
        medium?: { url?: string };
        high?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
};

type YouTubeVideosResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
};

export type YouTubeAnalyticsSnapshot = {
  subscribers: number | null;
  views: number | null;
  videos: number | null;
  channelTitle: string | null;
};

export type YouTubeTopVideo = {
  id: string;
  title: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
  videoUrl: string;
};

export async function fetchYouTubeAnalyticsSnapshot(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube analytics lookup failed: ${errorText}`);
  }

  const payload = (await response.json()) as YouTubeChannelStatsResponse;
  const channel = payload.items?.[0];
  const stats = channel?.statistics;

  return {
    subscribers: stats?.subscriberCount ? Number(stats.subscriberCount) : null,
    views: stats?.viewCount ? Number(stats.viewCount) : null,
    videos: stats?.videoCount ? Number(stats.videoCount) : null,
    channelTitle: channel?.snippet?.title ?? null,
  } satisfies YouTubeAnalyticsSnapshot;
}

export async function fetchYouTubeTopVideos(accessToken: string, limit = 6) {
  const channelResponse = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!channelResponse.ok) {
    const errorText = await channelResponse.text();
    throw new Error(`YouTube channel content lookup failed: ${errorText}`);
  }

  const channelPayload = (await channelResponse.json()) as YouTubeChannelStatsResponse;
  const uploadsPlaylistId =
    channelPayload.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    return [] as YouTubeTopVideo[];
  }

  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${uploadsPlaylistId}&maxResults=25`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!playlistResponse.ok) {
    const errorText = await playlistResponse.text();
    throw new Error(`YouTube playlist lookup failed: ${errorText}`);
  }

  const playlistPayload = (await playlistResponse.json()) as YouTubePlaylistItemsResponse;
  const videoBaseItems = (playlistPayload.items ?? [])
    .map((item) => ({
      id: item.contentDetails?.videoId ?? null,
      title: item.snippet?.title ?? "Untitled video",
      publishedAt: item.contentDetails?.videoPublishedAt ?? null,
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        null,
    }))
    .filter((item): item is { id: string; title: string; publishedAt: string | null; thumbnailUrl: string | null } => Boolean(item.id));

  if (videoBaseItems.length === 0) {
    return [] as YouTubeTopVideo[];
  }

  const ids = videoBaseItems.map((item) => item.id).join(",");
  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${ids}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!videosResponse.ok) {
    const errorText = await videosResponse.text();
    throw new Error(`YouTube video stats lookup failed: ${errorText}`);
  }

  const videosPayload = (await videosResponse.json()) as YouTubeVideosResponse;
  const detailsById = new Map(
    (videosPayload.items ?? []).map((item) => [
      item.id,
      {
        stats: item.statistics,
        duration: item.contentDetails?.duration ?? null,
      },
    ]),
  );

  return videoBaseItems
    .map((item) => {
      const details = detailsById.get(item.id);
      const stats = details?.stats;
      const durationSeconds = parseIsoDurationToSeconds(details?.duration ?? null);
      return {
        id: item.id,
        title: item.title,
        publishedAt: item.publishedAt,
        thumbnailUrl: item.thumbnailUrl,
        durationSeconds,
        views: Number(stats?.viewCount ?? 0),
        likes: Number(stats?.likeCount ?? 0),
        comments: Number(stats?.commentCount ?? 0),
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
      } satisfies YouTubeTopVideo;
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

function parseIsoDurationToSeconds(duration: string | null) {
  if (!duration) {
    return 0;
  }

  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) {
    return 0;
  }

  const hours = Number(matches[1] ?? 0);
  const minutes = Number(matches[2] ?? 0);
  const seconds = Number(matches[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatNumber(value: number | null) {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    notation: value > 9999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}
