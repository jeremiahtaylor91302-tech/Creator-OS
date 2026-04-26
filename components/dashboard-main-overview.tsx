"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CalendarSnapshot = {
  connected: boolean;
  budgetHours: number;
  trackedHours: number;
  trackedEvents: number;
  publishingEvents: number;
  contentDueByType?: Array<{ type: string; count: number }>;
  schedule?: Array<{
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    durationMinutes: number;
    kind: "publish" | "production" | "editing" | "other";
    isContent: boolean;
  }>;
  calendarStatsUnavailable?: boolean;
  lastCalendarError?: string;
};

type OnboardingNextStep = {
  title: string;
  href: string;
};

const defaultSnapshot: CalendarSnapshot = {
  connected: false,
  budgetHours: 2,
  trackedHours: 0,
  trackedEvents: 0,
  publishingEvents: 0,
  contentDueByType: [],
  schedule: [],
  calendarStatsUnavailable: false,
};

function formatDayBadge(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatTimeRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function DashboardMainOverview(props: {
  onboardingCompleted: boolean;
  onboardingNextStep: OnboardingNextStep | null;
  activePlatforms: number;
  totalPlatforms: number;
  /** UI-only: show empty calendar / metrics like someone who has not connected Google Calendar. */
  newUserPreview?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<CalendarSnapshot>(defaultSnapshot);

  useEffect(() => {
    if (props.newUserPreview) {
      setSnapshot(defaultSnapshot);
      return;
    }

    let cancelled = false;
    async function load() {
      const response = await fetch("/api/calendar/weekly-production", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as CalendarSnapshot;
      if (cancelled) return;
      setSnapshot({
        ...defaultSnapshot,
        ...payload,
      });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [props.newUserPreview]);

  const schedule = snapshot.schedule ?? [];
  const contentDueByType = snapshot.contentDueByType ?? [];

  const budgetRatio =
    snapshot.budgetHours > 0
      ? Math.min(100, (snapshot.trackedHours / snapshot.budgetHours) * 100)
      : 0;

  const nextAction = useMemo(() => {
    if (!props.onboardingCompleted && props.onboardingNextStep) {
      return {
        title: props.onboardingNextStep.title,
        body: "This unlocks your dashboard flow and gets Creator OS fully calibrated.",
        href: props.onboardingNextStep.href,
        cta: "Do this now",
      };
    }

    const nextContentEvent = schedule.find((event) => event.isContent);
    if (nextContentEvent) {
      return {
        title: `Prep: ${nextContentEvent.title}`,
        body: `${formatDayBadge(nextContentEvent.startsAt)} • ${formatTimeRange(
          nextContentEvent.startsAt,
          nextContentEvent.endsAt,
        )}`,
        href: "#dashboard-schedule",
        cta: "View schedule",
      };
    }

    return {
      title: "Submit your next content idea",
      body: "Drop one rough concept and let the pressure cooker shape it into a plan.",
      href: "#idea-pressure-cooker",
      cta: "Open idea pipeline",
    };
  }, [props.onboardingCompleted, props.onboardingNextStep, schedule]);

  const dueTypeLabel =
    contentDueByType.length > 0
      ? contentDueByType.map((item) => `${item.count} ${item.type}`).join(" • ")
      : "No content-labeled events yet";

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border bg-surface-muted/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">This week</p>
          <p className="mt-2 text-2xl font-semibold">{snapshot.trackedEvents}</p>
          <p className="mt-1 text-xs text-muted-foreground">content due this week</p>
          <p className="mt-2 text-xs text-muted-foreground">{dueTypeLabel}</p>
        </article>

        <article className="rounded-2xl border bg-surface-muted/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Time budget</p>
          <p className="mt-2 text-2xl font-semibold">
            {snapshot.trackedHours.toFixed(1)}h / {snapshot.budgetHours.toFixed(1)}h
          </p>
          <div className="mt-3 rounded-full bg-black/30 p-1">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-accent to-accent-strong transition-all"
              style={{ width: `${Math.max(4, budgetRatio)}%` }}
            />
          </div>
        </article>

        <article className="rounded-2xl border bg-surface-muted/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Platforms active</p>
          <p className="mt-2 text-2xl font-semibold">
            {props.activePlatforms} / {props.totalPlatforms}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Connected channels currently feeding your operating view.
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-accent/25 bg-gradient-to-br from-surface to-surface-muted p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-accent">Next action</p>
        <h3 className="mt-2 text-lg font-semibold">{nextAction.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{nextAction.body}</p>
        <Link
          href={nextAction.href}
          className="mt-4 inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black transition hover:bg-accent-strong"
        >
          {nextAction.cta}
          <span aria-hidden="true">→</span>
        </Link>
      </article>

      <article id="dashboard-schedule" className="rounded-2xl border bg-surface-muted/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Schedule</h2>
          <span className="text-xs text-muted-foreground">
            {snapshot.connected ? "Google Calendar connected" : "Calendar not connected"}
          </span>
        </div>
        {snapshot.connected && snapshot.calendarStatsUnavailable && snapshot.lastCalendarError ? (
          <p className="mt-2 text-xs text-amber-200/90">{snapshot.lastCalendarError}</p>
        ) : null}

        {schedule.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {schedule.slice(0, 10).map((event) => (
              <li
                key={event.id}
                className="flex items-start gap-3 rounded-xl border bg-surface px-3 py-3 sm:items-center"
              >
                <span className="inline-flex min-w-12 justify-center rounded-md border bg-surface-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {formatDayBadge(event.startsAt)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatTimeRange(event.startsAt, event.endsAt)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{event.durationMinutes}m</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border bg-surface px-3 py-3 text-sm text-muted-foreground">
            No upcoming events in your current week window yet.
          </p>
        )}
      </article>
    </section>
  );
}
