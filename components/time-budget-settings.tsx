"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "creatoros-time-budget";

export function TimeBudgetSettings() {
  const [hours, setHours] = useState<number>(() => {
    if (typeof window === "undefined") {
      return 2;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(hours));
  }, [hours]);

  return (
    <section className="rounded-2xl border bg-surface-muted/70 p-5">
      <h2 className="text-lg font-semibold">Weekly time budget</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Used by Idea Pressure Cooker and scheduling decisions.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="number"
          min={0.5}
          step={0.5}
          value={hours}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next > 0) {
              setHours(next);
            }
          }}
          className="w-28 rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring"
        />
        <span className="text-sm text-muted-foreground">hours per week</span>
      </div>
    </section>
  );
}
