"use client";

import { useEffect, useMemo, useState } from "react";

type TrackId = "singing" | "dance" | "art";
type Cadence = "weekly" | "monthly" | "quarterly";
type Status = "on-track" | "due-soon" | "overdue";

type TrainingItem = {
  id: string;
  title: string;
  cadence: Cadence;
};

const TRACKS: Record<TrackId, { label: string; items: TrainingItem[] }> = {
  singing: {
    label: "Singing / Music",
    items: [
      { id: "vocal", title: "Vocal lesson", cadence: "weekly" },
      { id: "instrument", title: "Guitar / instrument coaching", cadence: "monthly" },
      { id: "performance", title: "Performance coaching", cadence: "quarterly" },
    ],
  },
  dance: {
    label: "Dance",
    items: [
      { id: "technique", title: "Technique class", cadence: "weekly" },
      { id: "choreo", title: "Choreography lab", cadence: "monthly" },
      { id: "stage", title: "Stage performance workshop", cadence: "quarterly" },
    ],
  },
  art: {
    label: "Art / Visual",
    items: [
      { id: "fundamentals", title: "Fundamentals training", cadence: "weekly" },
      { id: "portfolio", title: "Portfolio review", cadence: "monthly" },
      { id: "masterclass", title: "Masterclass / mentorship", cadence: "quarterly" },
    ],
  },
};

const STORAGE_KEY = "creatoros-training-compliance";

type StoredState = {
  track: TrackId;
  completions: Record<string, string>;
};

const defaultState: StoredState = {
  track: "singing",
  completions: {},
};

export function TrainingCompliance() {
  const [state, setState] = useState<StoredState>(() => {
    if (typeof window === "undefined") {
      return defaultState;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    try {
      const parsed = JSON.parse(raw) as StoredState;
      if (parsed.track && parsed.completions) {
        return parsed;
      }
    } catch {
      // Ignore malformed local storage.
    }

    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const selectedTrack = TRACKS[state.track];
  const rows = useMemo(
    () =>
      selectedTrack.items.map((item) => {
        const completedAt = state.completions[item.id]
          ? new Date(state.completions[item.id])
          : null;
        const nextDue = calculateNextDue(completedAt, item.cadence);
        const status = getStatus(nextDue);

        return {
          item,
          completedAt,
          nextDue,
          status,
        };
      }),
    [selectedTrack.items, state.completions],
  );

  return (
    <article className="rounded-2xl border bg-surface-muted/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Training compliance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay accountable to required lessons so your growth skills keep compounding.
          </p>
        </div>
        <select
          value={state.track}
          onChange={(event) =>
            setState((prev) => ({ ...prev, track: event.target.value as TrackId }))
          }
          className="rounded-lg border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring"
        >
          {(Object.keys(TRACKS) as TrackId[]).map((trackId) => (
            <option key={trackId} value={trackId}>
              {TRACKS[trackId].label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div
            key={row.item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface px-3 py-3"
          >
            <div>
              <p className="text-sm font-medium">{row.item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Required cadence: {formatCadence(row.item.cadence)} · Next due:{" "}
                {formatDate(row.nextDue)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={[
                  "rounded-full px-2 py-1 text-[11px] font-semibold",
                  row.status === "on-track"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : row.status === "due-soon"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-rose-500/15 text-rose-300",
                ].join(" ")}
              >
                {row.status === "on-track"
                  ? "On track"
                  : row.status === "due-soon"
                    ? "Due soon"
                    : "Overdue"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    completions: {
                      ...prev.completions,
                      [row.item.id]: new Date().toISOString(),
                    },
                  }))
                }
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90"
              >
                Mark done
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatCadence(cadence: Cadence) {
  if (cadence === "weekly") return "once per week";
  if (cadence === "monthly") return "once per month";
  return "at least once per quarter";
}

function calculateNextDue(completedAt: Date | null, cadence: Cadence) {
  const base = completedAt ? new Date(completedAt) : new Date();
  const days = cadence === "weekly" ? 7 : cadence === "monthly" ? 30 : 90;
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function getStatus(nextDue: Date): Status {
  const now = new Date();
  const msUntilDue = nextDue.getTime() - now.getTime();
  const daysUntilDue = msUntilDue / (24 * 60 * 60 * 1000);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "due-soon";
  return "on-track";
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
