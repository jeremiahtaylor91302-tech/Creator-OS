"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTrackedPlatforms } from "@/app/actions/update-tracked-platforms";
import { OauthConnectLink } from "@/components/oauth-connect-link";
import {
  isPlatform,
  PLATFORM_OAUTH_BENEFIT_LINES,
  TRACKING_PLATFORM_LABELS,
  TRACKING_PLATFORMS,
  type Platform,
  type TrackingPlatform,
} from "@/lib/platforms";

export type OauthConnectSlot = {
  status: "connected" | "pending" | "failed" | "not connected";
  handle: string | null;
  actionHref: string;
  actionLabel: string;
  comingSoon: boolean;
};

type SettingsPlatformRowsProps = {
  initialTracked: TrackingPlatform[];
  /** Per tracked platform with OAuth (or Pinterest/Substack coming-soon). Podcast omitted. */
  oauthByPlatform: Partial<Record<TrackingPlatform, OauthConnectSlot>>;
};

const compactCtaClass =
  "inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black no-underline shadow-sm transition hover:bg-accent-strong active:scale-[0.98]";

function statusDotClass(status: OauthConnectSlot["status"]) {
  if (status === "connected") return "bg-emerald-400";
  if (status === "pending") return "bg-amber-400";
  return "bg-zinc-500";
}

export function SettingsPlatformRows({ initialTracked, oauthByPlatform }: SettingsPlatformRowsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tracked, setTracked] = useState<Set<TrackingPlatform>>(() => new Set(initialTracked));
  const [message, setMessage] = useState<string | null>(null);

  const toggle = (id: TrackingPlatform) => {
    const prev = new Set(tracked);
    const next = new Set(tracked);
    if (next.has(id)) {
      if (next.size <= 1) {
        setMessage("Keep at least one platform on.");
        return;
      }
      next.delete(id);
    } else {
      next.add(id);
    }

    setMessage(null);
    setTracked(next);

    startTransition(async () => {
      const result = await updateTrackedPlatforms([...next]);
      if (!result.ok) {
        setTracked(prev);
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mt-4 space-y-3">
      <ul className="divide-y divide-border/60 rounded-xl border border-border/80 bg-surface">
        {TRACKING_PLATFORMS.map((id) => {
          const on = tracked.has(id);
          const disableOff = on && tracked.size <= 1;
          const benefit =
            id === "pinterest" || id === "substack"
              ? "Integration coming soon — we’ll use this when you connect."
              : PLATFORM_OAUTH_BENEFIT_LINES[id as Platform] ??
                (id === "podcast"
                  ? "Show podcast metrics on the dashboard when linking is available."
                  : null);

          const oauth = on ? oauthByPlatform[id] : undefined;
          const showOauthRow =
            on &&
            oauth &&
            ((isPlatform(id) && id !== "podcast") || id === "pinterest" || id === "substack");

          const normalizedHandle = oauth?.handle ? oauth.handle.replace(/^@+/, "") : null;

          return (
            <li key={id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{TRACKING_PLATFORM_LABELS[id]}</p>
                  {benefit ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">{benefit}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`Track ${TRACKING_PLATFORM_LABELS[id]}`}
                  disabled={pending || disableOff}
                  onClick={() => toggle(id)}
                  className={[
                    "relative mt-0.5 h-8 w-14 shrink-0 overflow-hidden rounded-full border transition",
                    on ? "border-accent/60 bg-accent/25" : "border-border bg-background/60",
                    (pending || disableOff) && "cursor-not-allowed opacity-60",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "pointer-events-none absolute left-1 top-1 block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-out",
                      on ? "translate-x-7" : "translate-x-0",
                    ].join(" ")}
                  />
                </button>
              </div>

              {id === "podcast" && on ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Account linking for podcast hosts is coming soon.
                </p>
              ) : null}

              {!on && isPlatform(id) && id !== "podcast" ? (
                <p className="mt-2 text-xs text-muted-foreground">Turn on to connect this account.</p>
              ) : null}

              {showOauthRow ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface-muted/50 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(oauth!.status)}`} />
                    {oauth!.comingSoon ? (
                      <span>Not available yet</span>
                    ) : normalizedHandle ? (
                      <span className="truncate font-medium text-foreground">@{normalizedHandle}</span>
                    ) : (
                      <span>Not connected</span>
                    )}
                  </div>
                  {oauth!.comingSoon ? (
                    <span className="inline-flex cursor-not-allowed items-center rounded-lg border border-border/80 bg-background/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      Coming soon
                    </span>
                  ) : (
                    <OauthConnectLink href={oauth!.actionHref} className={compactCtaClass}>
                      {oauth!.actionLabel}
                    </OauthConnectLink>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {message ? <p className="text-xs text-amber-200">{message}</p> : null}
      {pending ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
    </div>
  );
}
