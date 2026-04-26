import { OauthConnectLink } from "@/components/oauth-connect-link";
import type { Platform } from "@/lib/platforms";
import {
  isPlatform,
  isTrackingPlatform,
  PLATFORM_LABELS,
  PLATFORM_OAUTH_BENEFIT_LINES,
  TRACKING_PLATFORM_LABELS,
} from "@/lib/platforms";

type ConnectionStatus = "connected" | "pending" | "failed" | "not connected";

type PlatformConnectionCardProps = {
  platform: Platform | string;
  status: ConnectionStatus;
  handle?: string | null;
  actionHref: string;
  actionLabel: string;
  actionDisabled?: boolean;
  /** When true, show Coming soon badge and block the connect CTA (non-preview users). */
  comingSoon?: boolean;
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

const trackingOnlyTheme: Record<string, { glow: string; iconBg: string }> = {
  pinterest: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-rose-600/15 text-rose-200",
  },
  substack: {
    glow: "rgba(236,236,241,0.16)",
    iconBg: "bg-orange-500/15 text-orange-200",
  },
};

const fallbackTheme = {
  glow: "rgba(236,236,241,0.16)",
  iconBg: "bg-zinc-500/15 text-zinc-300",
};

/** CSS-only shadows avoid inline style recalculation on interaction (INP). */
const cardShadowConnected =
  "[box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_0_22px_-14px_rgba(236,236,241,0.14),0_10px_24px_-22px_rgba(255,255,255,0.1)]";
const cardShadowIdle = "[box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.02)]";

const connectCtaClassName =
  "mt-4 inline-flex w-full cursor-pointer touch-manipulation items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black no-underline shadow-sm transition hover:bg-accent-strong hover:shadow-md active:scale-[0.98] active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function benefitLine(platform: Platform | string, comingSoon: boolean): string | null {
  if (platform === "podcast") {
    return null;
  }
  if (isPlatform(platform)) {
    return PLATFORM_OAUTH_BENEFIT_LINES[platform] ?? null;
  }
  if (comingSoon) {
    return "We're still building this connection — your toggle stays ready for launch.";
  }
  return "Connect when this integration goes live.";
}

export function PlatformConnectionCard({
  platform,
  status,
  handle,
  actionHref,
  actionLabel,
  actionDisabled = false,
  comingSoon = false,
}: PlatformConnectionCardProps) {
  if (platform === "podcast") {
    return null;
  }

  const theme =
    platformTheme[platform as Platform] ??
    trackingOnlyTheme[typeof platform === "string" ? platform : ""] ??
    fallbackTheme;
  const label =
    typeof platform === "string" && isTrackingPlatform(platform)
      ? TRACKING_PLATFORM_LABELS[platform]
      : PLATFORM_LABELS[platform as Platform] ?? "Platform";
  const normalizedHandle = handle ? handle.replace(/^@+/, "") : null;
  const benefit = benefitLine(platform, comingSoon);
  const statusDot =
    status === "connected"
      ? "bg-emerald-400"
      : status === "pending"
        ? "bg-amber-400"
        : "bg-zinc-500";

  return (
    <article
      className={`rounded-2xl bg-surface-muted/70 p-4 ${
        status === "connected" ? cardShadowConnected : cardShadowIdle
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${theme.iconBg}`}
          >
            <PlatformBrandIcon platform={platform} />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium">{label}</span>
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
            {comingSoon ? (
              <span className="rounded-full border border-border/80 bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Coming soon
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {benefit ? (
        <p className="mt-3 text-pretty text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
          {benefit}
        </p>
      ) : null}

      <p className="mt-2 truncate text-[11px] text-muted-foreground">
        {comingSoon ? "Not available yet" : normalizedHandle ? `@${normalizedHandle}` : "Not connected"}
      </p>

      {comingSoon ? (
        <span className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-border/80 bg-background/40 px-3 py-2 text-sm font-semibold text-muted-foreground">
          Coming soon
        </span>
      ) : actionDisabled ? (
        <span className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-accent/30 px-3 py-2 text-sm font-semibold text-muted-foreground">
          {actionLabel}
        </span>
      ) : (
        <OauthConnectLink href={actionHref} className={connectCtaClassName}>
          {actionLabel}
        </OauthConnectLink>
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

  if (platform === "pinterest") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#E60023" />
        <path
          fill="#fff"
          d="M12 6.5c-2.9 0-5.3 2.1-5.3 4.7 0 2 1.1 3.7 2.7 4.3-.1-.7-.2-1.8 0-2.6.2-.9 1.3-5.8 1.3-5.8s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.8 0 1.2.6 1.2 1.4 0 .9-.6 2.2-.9 3.4-.3 1 .6 1.8 1.7 1.8 2 0 3.6-2.1 3.6-5.2 0-2.7-1.9-4.6-4.6-4.6Z"
        />
      </svg>
    );
  }

  if (platform === "substack") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#FF6719" />
        <path fill="#fff" d="M6 8h12v1.5H6V8Zm0 3h9v1.5H6V11Zm0 3h12v1.5H6V14Z" opacity="0.95" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}
