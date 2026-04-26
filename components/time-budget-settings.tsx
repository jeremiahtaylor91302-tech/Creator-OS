"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { updateWeeklyTimeBudget } from "@/app/actions/time-budget";

const STORAGE_KEY = "creatoros-time-budget";

type TimeBudgetSettingsProps = {
  initialHours: number;
};

export function TimeBudgetSettings({ initialHours }: TimeBudgetSettingsProps) {
  const [hours, setHours] = useState(() =>
    Number.isFinite(initialHours) && initialHours >= 0.5 ? initialHours : 2,
  );
  const [pending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next = Number.isFinite(initialHours) && initialHours >= 0.5 ? initialHours : 2;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(next));
    }
  }, [initialHours]);

  const scheduleSave = useCallback((next: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(next));
    }
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await updateWeeklyTimeBudget(next);
      });
    }, 450);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  return (
    <section className="rounded-2xl border bg-surface-muted/70 p-5">
      <h2 className="text-lg font-semibold">Weekly time budget</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Used by Idea Pressure Cooker, calendar production tracking, and scheduling decisions.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="number"
          min={0.5}
          step={0.5}
          value={hours}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next >= 0.5) {
              setHours(next);
              scheduleSave(next);
            }
          }}
          className="w-28 rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring"
        />
        <span className="text-sm text-muted-foreground">hours per week</span>
        {pending ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
      </div>
    </section>
  );
}
