"use client";

import { useState, useTransition } from "react";
import { createRoadmap } from "@/app/(app)/direction/actions";

const defaultRoadmap = `# 90-Day Music Growth Roadmap

Run the AI generator to create your personalized roadmap.`;

export function RoadmapGenerator() {
  const [isPending, startTransition] = useTransition();
  const [roadmap, setRoadmap] = useState(defaultRoadmap);
  const parsed = parseRoadmap(roadmap);

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          startTransition(async () => {
            const generated = await createRoadmap(formData);
            setRoadmap(generated);
          });
        }}
      >
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Direction</span>
          <input
            name="direction"
            defaultValue="Music"
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/40 focus:ring"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Audience</span>
          <input
            name="audience"
            defaultValue="Independent music listeners and aspiring artists"
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/40 focus:ring"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Cadence</span>
          <input
            name="cadence"
            defaultValue="3 uploads per week"
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/40 focus:ring"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Strengths</span>
          <input
            name="strengths"
            defaultValue="Authentic storytelling and consistent posting"
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/40 focus:ring"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs text-muted-foreground">Goals</span>
          <input
            name="goals"
            defaultValue="Grow subscribers, increase repeat viewers, and build loyal music community"
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none ring-accent/40 focus:ring"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
          >
            {isPending ? "Generating roadmap..." : "Generate AI Roadmap"}
          </button>
        </div>
      </form>

      <article className="rounded-2xl border bg-surface-muted p-4">
        <div className="rounded-2xl border bg-surface p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-lg">
              ✦
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                North Star
              </p>
              <h3 className="mt-1 text-xl font-semibold leading-tight">
                {parsed.northStar || "Define your next growth objective and run the generator."}
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {parsed.months.map((month, index) => (
              <section
                key={month.title}
                className="rounded-xl border bg-surface-muted/70 p-4"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: MONTH_COLORS[index % MONTH_COLORS.length],
                }}
              >
                <p className="text-sm font-semibold">{month.title}</p>
                <div className="mt-3 space-y-2">
                  {month.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border bg-surface px-3 py-2 text-xs text-muted-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-5 rounded-xl border bg-surface-muted/70 p-4">
            <p className="text-sm font-semibold">Weekly KPI Targets</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {parsed.kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-lg border bg-surface px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{kpi.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}

const MONTH_COLORS = ["#8b5cf6", "#6366f1", "#a855f7"];

type ParsedRoadmap = {
  northStar: string;
  months: Array<{ title: string; items: string[] }>;
  kpis: Array<{ label: string; value: string }>;
};

function parseRoadmap(text: string): ParsedRoadmap {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = new Map<string, string[]>();
  let current = "";

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      current = headingMatch[1].trim();
      sections.set(current, []);
      continue;
    }

    if (!current) {
      continue;
    }

    sections.get(current)?.push(line.replace(/^- /, "").trim());
  }

  const sectionEntries = [...sections.entries()];
  const northStarRaw =
    getSectionByPrefix(sectionEntries, "north star")?.[1] ?? [];
  const northStar = northStarRaw.join(" ").trim();

  const months = ["Month 1", "Month 2", "Month 3"].map((title) => ({
    title,
    items: (
      getSectionByPrefix(sectionEntries, title.toLowerCase())?.[1] ??
      defaultMonthItems(title)
    ).map((item) => item.replace(/^- /, "").trim()),
  }));

  const rawKpis = (
    getSectionByPrefix(sectionEntries, "weekly kpi targets")?.[1] ?? [
      "Consistency: follow your content plan weekly.",
      "Engagement: improve comments and saves through stronger hooks.",
      "Conversion: increase clicks to your streaming links.",
    ]
  ).map((item) => item.replace(/^- /, "").trim());

  const kpis = rawKpis.map((item) => {
    const [label, ...rest] = item.split(":");
    if (rest.length === 0) {
      return { label: "Target", value: item };
    }

    return {
      label: label.trim(),
      value: rest.join(":").trim(),
    };
  });

  return { northStar, months, kpis };
}

function getSectionByPrefix(
  entries: Array<[string, string[]]>,
  prefix: string,
) {
  return entries.find(([key]) => key.toLowerCase().startsWith(prefix));
}

function defaultMonthItems(title: string) {
  if (title === "Month 1") {
    return [
      "Pick 3 content formats and commit to one clear posting rhythm.",
      "Write stronger first 10-second hooks before filming.",
      "Test thumbnail/title style on every upload.",
    ];
  }

  if (title === "Month 2") {
    return [
      "Double down on your top-performing format.",
      "Batch-produce content so quality stays consistent.",
      "Push viewers toward your streaming links with direct CTAs.",
    ];
  }

  return [
    "Build one repeatable series your audience expects weekly.",
    "Run one collaboration to reach new listeners.",
    "Review monthly performance and keep only what works.",
  ];
}
