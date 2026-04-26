"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "creatoros-brand-baseline";

type Baseline = {
  niche: string;
  goals: string;
  contentStyle: string;
};

const defaultBaseline: Baseline = {
  niche: "Music creator",
  goals: "Grow streams and audience loyalty",
  contentStyle: "Emotional, cinematic, artist-first storytelling",
};

export function BrandBaselineSettings() {
  const [baseline, setBaseline] = useState<Baseline>(() => {
    if (typeof window === "undefined") {
      return defaultBaseline;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultBaseline;

    try {
      const parsed = JSON.parse(raw) as Baseline;
      return {
        niche: parsed.niche || defaultBaseline.niche,
        goals: parsed.goals || defaultBaseline.goals,
        contentStyle: parsed.contentStyle || defaultBaseline.contentStyle,
      };
    } catch {
      return defaultBaseline;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(baseline));
  }, [baseline]);

  return (
    <section className="rounded-2xl border bg-surface-muted/70 p-5">
      <h2 className="text-lg font-semibold">Brand baseline</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Used by AI to judge brand alignment in Idea Pressure Cooker.
      </p>

      <div className="mt-4 grid gap-3">
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Niche</span>
          <input
            value={baseline.niche}
            onChange={(event) =>
              setBaseline((prev) => ({ ...prev, niche: event.target.value }))
            }
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Goals</span>
          <input
            value={baseline.goals}
            onChange={(event) =>
              setBaseline((prev) => ({ ...prev, goals: event.target.value }))
            }
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Content style</span>
          <input
            value={baseline.contentStyle}
            onChange={(event) =>
              setBaseline((prev) => ({ ...prev, contentStyle: event.target.value }))
            }
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring"
          />
        </label>
      </div>
    </section>
  );
}
