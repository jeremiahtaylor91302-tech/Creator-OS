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
    icon: string;
  }
> = {
  youtube: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-red-500/15 text-red-300",
    icon: "▶",
  },
  tiktok: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-zinc-400/15 text-zinc-300",
    icon: "♪",
  },
  instagram: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-pink-500/15 text-pink-300",
    icon: "◉",
  },
  twitter: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-blue-500/15 text-blue-300",
    icon: "𝕏",
  },
  podcast: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-amber-500/15 text-amber-300",
    icon: "◍",
  },
};

const fallbackTheme = {
  glow: "rgba(236,236,241,0.16)",
  iconBg: "bg-zinc-500/15 text-zinc-300",
  icon: "•",
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
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${theme.iconBg}`}
          >
            {theme.icon}
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
