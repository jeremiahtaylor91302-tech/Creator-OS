"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTrackedPlatforms } from "@/app/actions/update-tracked-platforms";
import {
  TRACKING_PLATFORM_LABELS,
  TRACKING_PLATFORMS,
  type TrackingPlatform,
} from "@/lib/platforms";

type TrackedPlatformsFormProps = {
  initialTracked: TrackingPlatform[];
};

export function TrackedPlatformsForm({ initialTracked }: TrackedPlatformsFormProps) {
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
          return (
            <li key={id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{TRACKING_PLATFORM_LABELS[id]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {id === "pinterest" || id === "substack"
                    ? "Integration coming soon — we’ll use this when you connect."
                    : "Show in your dashboard and connection list."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Track ${TRACKING_PLATFORM_LABELS[id]}`}
                disabled={pending || disableOff}
                onClick={() => toggle(id)}
                className={[
                  "relative h-8 w-14 shrink-0 overflow-hidden rounded-full border transition",
                  on
                    ? "border-accent/60 bg-accent/25"
                    : "border-border bg-background/60",
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
            </li>
          );
        })}
      </ul>
      {message ? <p className="text-xs text-amber-200">{message}</p> : null}
      {pending ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
    </div>
  );
}
