"use client";

import { useEffect, useMemo, useState } from "react";

const TIME_BUDGET_KEY = "creatoros-time-budget";

type WeeklyStats = {
  connected: boolean;
  trackedHours: number;
  trackedEvents: number;
  publishingEvents: number;
};

export function CalendarProductionProgress() {
  const [budgetHours] = useState(() => {
    if (typeof window === "undefined") return 2;
    const raw = localStorage.getItem(TIME_BUDGET_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
  });
  const [stats, setStats] = useState<WeeklyStats>({
    connected: false,
    trackedHours: 0,
    trackedEvents: 0,
    publishingEvents: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch("/api/calendar/weekly-production", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = (await response.json()) as WeeklyStats;
      if (!cancelled) {
        setStats(data);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const usageRatio = useMemo(() => {
    if (budgetHours <= 0) return 0;
    return stats.trackedHours / budgetHours;
  }, [budgetHours, stats.trackedHours]);

  const progress = useMemo(() => {
    if (budgetHours <= 0) return 0;
    return Math.min(100, usageRatio * 100);
  }, [budgetHours, usageRatio]);

  const colorClass =
    usageRatio < 0.8
      ? "bg-emerald-400"
      : usageRatio <= 1
        ? "bg-amber-400"
        : "bg-rose-400";

  return (
    <section className="rounded-2xl border bg-surface-muted/70 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Calendar production tracking</h2>
        <span className="text-xs text-muted-foreground">
          {stats.connected ? "Google Calendar connected" : "Calendar not connected"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Weekly production budget: {budgetHours.toFixed(1)}h (film + edit + publish).
      </p>

      <div className="mt-4 rounded-full bg-black/30 p-1">
        <div
          className={`h-2 rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Tracked: {stats.trackedHours.toFixed(2)}h</span>
        <span>Events: {stats.trackedEvents}</span>
        <span>Publishing events: {stats.publishingEvents}</span>
      </div>

      {stats.publishingEvents < 1 && (
        <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          Minimum viable content nudge: no publish/upload event logged this week yet.
        </p>
      )}
    </section>
  );
}
