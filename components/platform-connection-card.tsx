import Link from "next/link";
import type { Platform } from "@/lib/platforms";
import { PLATFORM_LABELS } from "@/lib/platforms";

type ConnectionStatus = "connected" | "pending" | "failed" | "not connected";

type PlatformConnectionCardProps = {
  platform: Platform | string;
  status: ConnectionStatus;
  handle?: string | null;
  actionHref: string;
  actionLabel: string;
  actionDisabled?: boolean;
};

const platformTheme: Record<
  Platform,
  {
    glow: string;
    iconBg: string;
  }
> = {
  youtube: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-red-500/15 text-red-300",
  },
  tiktok: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-zinc-400/15 text-zinc-300",
  },
  instagram: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-pink-500/15 text-pink-300",
  },
  twitter: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-blue-500/15 text-blue-300",
  },
  podcast: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-amber-500/15 text-amber-300",
  },
};

const fallbackTheme = {
  glow: "rgba(236,236,241,0.16)",
  iconBg: "bg-zinc-500/15 text-zinc-300",
};

export function PlatformConnectionCard({
  platform,
  status,
  handle,
  actionHref,
  actionLabel,
  actionDisabled = false,
}: PlatformConnectionCardProps) {
  const theme = platformTheme[platform as Platform] ?? fallbackTheme;
  const label = PLATFORM_LABELS[platform as Platform] ?? "Platform";
  const normalizedHandle = handle ? handle.replace(/^@+/, "") : null;
  const statusDot =
    status === "connected"
      ? "bg-emerald-400"
      : status === "pending"
        ? "bg-amber-400"
        : "bg-zinc-500";

  return (
    <article
      className="rounded-2xl bg-surface-muted/70 p-4"
      style={{
        background: "var(--color-surface-muted)",
        boxShadow:
          status === "connected"
            ? `inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 20px -14px ${theme.glow}, 0 10px 24px -22px rgba(255,255,255,0.12)`
            : "inset 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-md ${theme.iconBg}`}
          >
            <PlatformBrandIcon platform={platform} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            <span className={`h-2 w-2 rounded-full ${statusDot}`} />
          </div>
        </div>
      </div>

      <p className="mt-3 truncate text-[11px] text-muted-foreground">
        {normalizedHandle ? `@${normalizedHandle}` : "Not connected"}
      </p>

      {actionDisabled ? (
        <span className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-accent/30 px-3 py-2 text-sm font-semibold text-muted-foreground">
          {actionLabel}
        </span>
      ) : (
        <Link
          href={actionHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}
    </article>
  );
}

function PlatformBrandIcon({ platform }: { platform: Platform | string }) {
  if (platform === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="#FF0000"
          d="M23.5 6.2a3.1 3.1 0 0 0-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5A3.1 3.1 0 0 0 .5 6.2 32.4 32.4 0 0 0 0 12a32.4 32.4 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.2 2.2c1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5a3.1 3.1 0 0 0 2.2-2.2A32.4 32.4 0 0 0 24 12a32.4 32.4 0 0 0-.5-5.8Z"
        />
        <path fill="#fff" d="M9.7 8.4 16.3 12l-6.6 3.6V8.4Z" />
      </svg>
    );
  }

  if (platform === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="#000000"
          d="M14.9 3h2.8c.2 1.6 1.1 3 2.6 3.7.6.3 1.2.4 1.8.5v2.9c-1.1 0-2.2-.3-3.2-.8-.4-.2-.7-.4-1.1-.7V15c0 3.3-2.7 6-6 6a6 6 0 1 1 0-12c.3 0 .7 0 1 .1v3a3.1 3.1 0 0 0-1-.2 3 3 0 1 0 3 3V3Z"
        />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <defs>
          <linearGradient id="instagramGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="45%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#8134AF" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#instagramGradient)" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="1.8" />
        <circle cx="17" cy="7" r="1.3" fill="#fff" />
      </svg>
    );
  }

  if (platform === "twitter") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="#000000"
          d="M18.2 3H21l-6.1 7 7.1 11h-5.6l-4.4-6.8L5.9 21H3.1l6.5-7.5L2.8 3h5.7l4 6.2L18.2 3Zm-1 16.3h1.5L8 4.6H6.4l10.8 14.7Z"
        />
      </svg>
    );
  }

  if (platform === "podcast") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="#9333EA"
          d="M12 2a10 10 0 0 0-6.9 17.3l2-2A7 7 0 1 1 17 17.3l2 2A10 10 0 0 0 12 2Zm0 4a6 6 0 0 0-4.2 10.3l2-2A3 3 0 1 1 14.2 14l2 2A6 6 0 0 0 12 6Zm0 4a2 2 0 0 0-1.4 3.4l.6.6-.8 6h3.2l-.8-6 .6-.6A2 2 0 0 0 12 10Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}
