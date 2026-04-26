"use client";

import { useEffect, useMemo, useState } from "react";

type WeeklyStats = {
  connected: boolean;
  budgetHours: number;
  trackedHours: number;
  trackedEvents: number;
  publishingEvents: number;
  calendarStatsUnavailable?: boolean;
  lastCalendarError?: string;
};

const defaultStats: WeeklyStats = {
  connected: false,
  budgetHours: 2,
  trackedHours: 0,
  trackedEvents: 0,
  publishingEvents: 0,
};

export function CalendarProductionProgress() {
  const [stats, setStats] = useState<WeeklyStats>(defaultStats);

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
        setStats({
          ...defaultStats,
          ...data,
          budgetHours:
            typeof data.budgetHours === "number" && Number.isFinite(data.budgetHours) && data.budgetHours >= 0.5
              ? data.budgetHours
              : 2,
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const budgetHours = stats.budgetHours;

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

  const statusLabel = stats.connected
    ? stats.calendarStatsUnavailable
      ? "Connected · calendar data unavailable"
      : "Google Calendar connected"
    : "Calendar not connected";

  return (
    <section className="rounded-2xl border bg-surface-muted/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Calendar production tracking</h2>
        <span className="shrink-0 text-right text-xs text-muted-foreground">{statusLabel}</span>
      </div>
      {stats.connected && stats.calendarStatsUnavailable && stats.lastCalendarError ? (
        <p className="mt-2 text-xs text-amber-200/90">{stats.lastCalendarError}</p>
      ) : null}
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
