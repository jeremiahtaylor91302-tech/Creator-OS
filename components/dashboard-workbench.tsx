"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { analyzeIdea, getClarifyingTurn } from "@/app/(app)/dashboard/actions";

type Feasibility = "green" | "yellow" | "red";

type IdeaAnalysis = {
  timeEstimateHours: number;
  feasibility: Feasibility;
  fitDecision: string;
  suggestedSlot: string;
  difficulty: "Low" | "Medium" | "High";
  weekPlacement: string;
  keepSimpleNote: string;
  formatIdeas: Array<{
    format: string;
    timeMinutes: number;
  }>;
  brandAlignment: {
    score: number;
    explanation: string;
  };
  departureNote: string | null;
};

type AnalysisResult = {
  idea: string;
  analysis: IdeaAnalysis;
};

type ScheduleItem = {
  id: string;
  day: "Mon" | "Wed" | "Fri";
  slot: string;
  title: string;
  detail: string;
  scheduledFor?: string;
  originIdea?: string;
  timeEstimateHours?: number;
  feasibility?: Feasibility;
};

type SavedIdea = {
  id: string;
  type: "later" | "think";
  idea: string;
  timeEstimateHours: number;
  feasibility: Feasibility;
  note?: string;
};

type PersistedState = {
  schedule: ScheduleItem[];
  savedIdeas: SavedIdea[];
  tipHistory: string[];
};

const STORAGE_KEY = "creatoros-workbench-state";
const BASELINE_KEY = "creatoros-brand-baseline";
const TIME_BUDGET_KEY = "creatoros-time-budget";

const defaultSchedule: ScheduleItem[] = [
  {
    id: "base-mon",
    day: "Mon",
    slot: "Mon 7:00 PM",
    title: "Studio snippet + hook",
    detail: "30-45 sec short teasing a new idea.",
  },
  {
    id: "base-wed",
    day: "Wed",
    slot: "Wed 7:00 PM",
    title: "Songwriting breakdown",
    detail: "Explain one lyric or chord decision.",
  },
  {
    id: "base-fri",
    day: "Fri",
    slot: "Fri 6:30 PM",
    title: "Live-style performance",
    detail: "Flagship piece with full CTA to stream.",
  },
];

const defaultPersisted: PersistedState = {
  schedule: defaultSchedule,
  savedIdeas: [],
  tipHistory: [],
};

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const DEFAULT_BASELINE = {
  niche: "music creator",
  goals: "grow audience and streams",
  contentStyle: "authentic and performance-driven",
};

export function DashboardWorkbench({ latestPostedAt }: { latestPostedAt: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [ideaInput, setIdeaInput] = useState("");
  const [step, setStep] = useState<"idea" | "clarify" | "result">("idea");
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [askedCount, setAskedCount] = useState(0);
  const [answerInput, setAnswerInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showThinkNote, setShowThinkNote] = useState(false);
  const [thinkNote, setThinkNote] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [repeatTipNote, setRepeatTipNote] = useState<string | null>(null);

  const [persisted, setPersisted] = useState<PersistedState>(() => {
    if (typeof window === "undefined") {
      return defaultPersisted;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPersisted;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedState;
      if (Array.isArray(parsed.schedule) && Array.isArray(parsed.savedIdeas)) {
        return {
          schedule: parsed.schedule.map((item) => ({
            ...item,
            scheduledFor: typeof item.scheduledFor === "string" ? item.scheduledFor : undefined,
          })),
          savedIdeas: parsed.savedIdeas,
          tipHistory: Array.isArray(parsed.tipHistory) ? parsed.tipHistory : [],
        };
      }
    } catch {
      // Ignore malformed local storage.
    }

    return defaultPersisted;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [persisted]);

  useEffect(() => {
    if (latestPostedAt) {
      localStorage.setItem("creatoros-latest-posted-at", latestPostedAt);
    }
  }, [latestPostedAt]);

  const savedIdeasCount = persisted.savedIdeas.length;
  const canAskNext = step === "clarify";
  const weeklyHoursBudget = 2;
  const goalsBaseline = DEFAULT_BASELINE.goals;
  const latestPostedDate = useMemo(() => {
    if (!latestPostedAt) {
      return null;
    }
    const date = new Date(latestPostedAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [latestPostedAt]);
  const scheduledIdeaHours = persisted.schedule
    .map((item) => item.timeEstimateHours ?? 0)
    .reduce((sum, value) => sum + value, 0);
  const remainingHours = Math.max(0, weeklyHoursBudget - scheduledIdeaHours);
  const shouldShowInactivityAlert = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const latestScheduled = persisted.schedule
      .map((item) => (item.scheduledFor ? new Date(item.scheduledFor) : null))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const latestActivity = [latestScheduled, latestPostedDate]
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!latestActivity) {
      return true;
    }

    return latestActivity.getTime() < twoWeeksAgo.getTime();
  }, [latestPostedDate, persisted.schedule]);

  const scheduleByDay = useMemo(() => {
    return {
      Mon: persisted.schedule.filter((item) => item.day === "Mon"),
      Wed: persisted.schedule.filter((item) => item.day === "Wed"),
      Fri: persisted.schedule.filter((item) => item.day === "Fri"),
    };
  }, [persisted.schedule]);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {shouldShowInactivityAlert && (
        <article className="md:col-span-2 rounded-2xl border border-rose-500/50 bg-rose-600/15 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-300">
            Action required
          </p>
          <h3 className="mt-1 text-lg font-semibold text-rose-100">
            No posted or scheduled goal content in 14+ days.
          </h3>
          <p className="mt-2 text-sm text-rose-200/90">
            Your current goal focus is: {goalsBaseline}. Schedule at least one idea this
            week to avoid stalling progress.
          </p>
        </article>
      )}

      <article className="rounded-2xl border bg-surface-muted/70 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Content schedule</h2>
          <span className="rounded-full bg-accent/15 px-2 py-1 text-xs text-accent">
            This week
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Planned content from your weekly cadence and AI triage.
        </p>

        <div className="mt-3 rounded-xl border bg-surface px-3 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Weekly time allocation
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div className="rounded-lg border bg-surface-muted px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Budget
              </p>
              <p className="mt-1 text-sm">{weeklyHoursBudget.toFixed(1)}h</p>
            </div>
            <div className="rounded-lg border bg-surface-muted px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Planned
              </p>
              <p className="mt-1 text-sm">{scheduledIdeaHours.toFixed(1)}h</p>
            </div>
            <div className="rounded-lg border bg-surface-muted px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Remaining
              </p>
              <p className="mt-1 text-sm">{remainingHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {(["Mon", "Wed", "Fri"] as const).map((day) => (
            <div key={day} className="space-y-2">
              {scheduleByDay[day].map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border bg-surface px-3 py-3"
                >
                  <div className="min-w-10 rounded-md bg-surface-muted px-2 py-1 text-center text-xs font-semibold text-muted-foreground">
                    {item.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">{item.slot}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                    {item.originIdea && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md border bg-surface-muted px-2 py-1 text-[11px] text-muted-foreground">
                          {item.originIdea}
                        </span>
                        {typeof item.timeEstimateHours === "number" && (
                          <span className="rounded-md border bg-surface-muted px-2 py-1 text-[11px] text-muted-foreground">
                            {item.timeEstimateHours.toFixed(1)}h
                          </span>
                        )}
                        {item.feasibility && (
                          <span
                            className={`rounded-md border px-2 py-1 text-[11px] ${feasibilityClass(
                              item.feasibility,
                            )}`}
                          >
                            {item.feasibility}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border bg-surface-muted/70 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Idea pressure cooker</h2>
          <span className="rounded-full bg-accent/15 px-2 py-1 text-xs text-accent">
            Saved {savedIdeasCount}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze ideas for fit against your {weeklyHoursBudget.toFixed(1)}-hour weekly time budget.
        </p>

        {step === "idea" && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!ideaInput.trim()) return;
              setStep("clarify");
              setChat([]);
              setAskedCount(0);
              setAnswerInput("");
              setAnalysisResult(null);
              setRepeatTipNote(null);

              startTransition(async () => {
                const baseline = getBrandBaseline();
                const requestedBudget = getWeeklyHoursBudget();
                const firstTurn = await getClarifyingTurn({
                  idea: ideaInput.trim(),
                  conversation: [],
                  baseline,
                  askedCount: 0,
                  weeklyHours: requestedBudget,
                });

                setChat([{ role: "assistant", content: firstTurn.message }]);
                setAskedCount(firstTurn.readyToAnalyze ? 0 : 1);

                if (firstTurn.readyToAnalyze) {
                  const analysis = await analyzeIdea({
                    idea: ideaInput.trim(),
                    conversation: [{ role: "assistant", content: firstTurn.message }],
                    baseline,
                    weeklyHours: requestedBudget,
                  });
                  commitAnalysisResult({
                    idea: ideaInput.trim(),
                    analysis,
                    persisted,
                    setPersisted,
                    setRepeatTipNote,
                  });
                  setAnalysisResult({ idea: ideaInput.trim(), analysis });
                  setStep("result");
                  setShowThinkNote(false);
                  setThinkNote("");
                  setConfirmation(null);
                }
              });
            }}
          >
            <input
              name="idea"
              value={ideaInput}
              onChange={(event) => setIdeaInput(event.target.value)}
              placeholder="Type your content idea..."
              className="w-full rounded-xl border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
                Submit
            </button>
          </form>
        )}

        {step === "clarify" && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border bg-surface px-3 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Your idea
              </p>
              <p className="mt-1">{ideaInput}</p>
            </div>

            <div className="space-y-2">
              {chat.map((turn, index) => (
                <div key={`${index}-${turn.content}`} className="space-y-1">
                  {turn.role === "assistant" ? (
                    <div className="max-w-[90%] rounded-xl border bg-surface px-3 py-2 text-sm text-muted-foreground">
                      {turn.content}
                    </div>
                  ) : (
                    <div className="ml-auto max-w-[90%] rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
                      {turn.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canAskNext && (
              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = answerInput.trim();
                  if (!value) return;
                  const nextChat: ChatTurn[] = [...chat, { role: "user", content: value }];
                  setChat(nextChat);
                  setAnswerInput("");
                  startTransition(async () => {
                const baseline = getBrandBaseline();
                const requestedBudget = getWeeklyHoursBudget();
                    const turn = await getClarifyingTurn({
                      idea: ideaInput.trim(),
                      conversation: nextChat,
                      baseline,
                      askedCount,
                  weeklyHours: requestedBudget,
                    });

                    const fullChat: ChatTurn[] = [
                      ...nextChat,
                      { role: "assistant", content: turn.message },
                    ];
                    setChat(fullChat);

                    if (turn.readyToAnalyze || askedCount >= 5) {
                      const analysis = await analyzeIdea({
                        idea: ideaInput.trim(),
                        conversation: fullChat,
                        baseline,
                        weeklyHours: requestedBudget,
                      });

                      commitAnalysisResult({
                        idea: ideaInput.trim(),
                        analysis,
                        persisted,
                        setPersisted,
                        setRepeatTipNote,
                      });

                      setAnalysisResult({ idea: ideaInput.trim(), analysis });
                      setStep("result");
                      setShowThinkNote(false);
                      setThinkNote("");
                      setConfirmation(null);
                    } else {
                      setAskedCount((prev) => prev + 1);
                    }
                  });
                }}
              >
                <input
                  value={answerInput}
                  onChange={(event) => setAnswerInput(event.target.value)}
                  placeholder="Type your answer..."
                  className="w-full rounded-xl border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring"
                  required
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
                >
                  {isPending ? "Thinking..." : "Send"}
                </button>
              </form>
            )}
          </div>
        )}

        {step === "result" && analysisResult && (
          <section
            className={`mt-4 rounded-xl border p-4 ${feasibilityClass(
              analysisResult.analysis.feasibility,
            )}`}
          >
            <p className="text-sm font-semibold">{analysisResult.idea}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <ResultRow
                label="Time estimate"
                value={`${analysisResult.analysis.timeEstimateHours.toFixed(1)}h`}
              />
              <ResultRow label="Difficulty" value={analysisResult.analysis.difficulty} />
              <ResultRow label="Fit decision" value={analysisResult.analysis.fitDecision} />
              <ResultRow label="Suggested slot" value={analysisResult.analysis.suggestedSlot} />
              <ResultRow label="Week placement" value={analysisResult.analysis.weekPlacement} />
              <FeasibilityRow feasibility={analysisResult.analysis.feasibility} />
            </div>

            <article className="mt-3 rounded-lg border border-white/10 bg-black/10 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] opacity-75">
                How to keep it simple
              </p>
              <p className="mt-1 text-sm">{analysisResult.analysis.keepSimpleNote}</p>
            </article>
            {repeatTipNote && (
              <p className="mt-2 text-xs text-amber-300">{repeatTipNote}</p>
            )}

            <article className="mt-3 rounded-lg border border-white/10 bg-black/10 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] opacity-75">
                Brand alignment
              </p>
              <p className="mt-1 text-sm">
                {analysisResult.analysis.brandAlignment.score}% match
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {analysisResult.analysis.brandAlignment.explanation}
              </p>
              {analysisResult.analysis.departureNote && (
                <p className="mt-1 text-xs text-amber-300">
                  {analysisResult.analysis.departureNote}
                </p>
              )}
            </article>

            <article className="mt-3 rounded-lg border border-white/10 bg-black/10 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] opacity-75">
                Format ideas
              </p>
              <div className="mt-2 grid gap-2">
                {analysisResult.analysis.formatIdeas.map((format) => (
                  <div
                    key={`${format.format}-${format.timeMinutes}`}
                    className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{format.format}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ~{format.timeMinutes} min
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setAnalysisResult(null);
                  setStep("idea");
                  setChat([]);
                  setAskedCount(0);
                  setAnswerInput("");
                  setIdeaInput("");
                  setShowThinkNote(false);
                  setThinkNote("");
                  setConfirmation("Idea trashed.");
                }}
                className="rounded-lg border bg-black/20 px-3 py-2 text-sm transition hover:bg-black/35"
              >
                🗑️ Trash It
              </button>
              <button
                type="button"
                onClick={() => {
                  const scheduled = createPlannedScheduleItem(analysisResult);
                  setPersisted((prev) => ({
                    ...prev,
                    schedule: [...prev.schedule, scheduled],
                  }));
                  setAnalysisResult(null);
                  setStep("idea");
                  setChat([]);
                  setAskedCount(0);
                  setAnswerInput("");
                  setIdeaInput("");
                  setConfirmation(`Planned: ${scheduled.slot}`);
                }}
                className="rounded-lg border bg-black/20 px-3 py-2 text-sm transition hover:bg-black/35"
              >
                📅 Plan It
              </button>
              <button
                type="button"
                onClick={() => {
                  setPersisted((prev) => ({
                    ...prev,
                    savedIdeas: [
                      ...prev.savedIdeas,
                      {
                        id: crypto.randomUUID(),
                        type: "later",
                        idea: analysisResult.idea,
                        timeEstimateHours: analysisResult.analysis.timeEstimateHours,
                        feasibility: analysisResult.analysis.feasibility,
                      },
                    ],
                  }));
                  setAnalysisResult(null);
                  setStep("idea");
                  setChat([]);
                  setAskedCount(0);
                  setAnswerInput("");
                  setIdeaInput("");
                  setConfirmation("Saved for later.");
                }}
                className="rounded-lg border bg-black/20 px-3 py-2 text-sm transition hover:bg-black/35"
              >
                🕐 Later
              </button>
              <button
                type="button"
                onClick={() => setShowThinkNote((prev) => !prev)}
                className="rounded-lg border bg-black/20 px-3 py-2 text-sm transition hover:bg-black/35"
              >
                🤔 Think On It
              </button>
            </div>

            {showThinkNote && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={thinkNote}
                  onChange={(event) => setThinkNote(event.target.value)}
                  placeholder="Add context before deciding..."
                  className="min-h-[90px] w-full rounded-xl border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPersisted((prev) => ({
                      ...prev,
                      savedIdeas: [
                        ...prev.savedIdeas,
                        {
                          id: crypto.randomUUID(),
                          type: "think",
                          idea: analysisResult.idea,
                          note: thinkNote.trim() || undefined,
                          timeEstimateHours: analysisResult.analysis.timeEstimateHours,
                          feasibility: analysisResult.analysis.feasibility,
                        },
                      ],
                    }));
                    setAnalysisResult(null);
                    setStep("idea");
                    setChat([]);
                    setAskedCount(0);
                    setAnswerInput("");
                    setIdeaInput("");
                    setShowThinkNote(false);
                    setThinkNote("");
                    setConfirmation("Saved to Think On It queue.");
                  }}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Save note
                </button>
              </div>
            )}
          </section>
        )}

        {confirmation && <p className="mt-3 text-xs text-emerald-300">{confirmation}</p>}

        {persisted.savedIdeas.length > 0 && (
          <section className="mt-4 rounded-xl border bg-surface p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Saved ideas queue
            </p>
            <div className="mt-2 space-y-2">
              {persisted.savedIdeas.map((item) => (
                <div key={item.id} className="rounded-lg border bg-surface-muted px-3 py-2">
                  <p className="text-sm">{item.idea}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>{item.timeEstimateHours.toFixed(1)}h</span>
                    <span className={feasibilityClass(item.feasibility)}>
                      {item.feasibility}
                    </span>
                    <span>{item.type === "later" ? "Later" : "Think On It"}</span>
                  </div>
                  {item.note && (
                    <p className="mt-1 text-xs text-muted-foreground">Note: {item.note}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </section>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] opacity-75">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function FeasibilityRow({ feasibility }: { feasibility: Feasibility }) {
  const tone =
    feasibility === "green"
      ? "bg-emerald-400"
      : feasibility === "yellow"
        ? "bg-amber-400"
        : "bg-rose-400";

  const label =
    feasibility === "green"
      ? "Fits this week"
      : feasibility === "yellow"
        ? "Tight fit"
        : "Schedule later";

  return (
    <div className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] opacity-75">Feasibility</p>
      <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs">
        <span className={`h-2 w-2 rounded-full ${tone}`} />
        <span>{label}</span>
      </div>
    </div>
  );
}

function feasibilityClass(feasibility: Feasibility) {
  if (feasibility === "green") {
    return "border-emerald-500/40 bg-emerald-500/12 text-emerald-200";
  }
  if (feasibility === "yellow") {
    return "border-amber-500/40 bg-amber-500/12 text-amber-200";
  }
  return "border-rose-500/40 bg-rose-500/12 text-rose-200";
}

function createPlannedScheduleItem(result: AnalysisResult): ScheduleItem {
  const day = inferDay(result.analysis.suggestedSlot);
  const scheduledFor = nextDateForDay(day).toISOString();

  return {
    id: crypto.randomUUID(),
    day,
    slot: result.analysis.suggestedSlot || `${day} 7:00 PM`,
    title: "Planned idea",
    detail: "AI-slotted idea added from Pressure Cooker.",
    scheduledFor,
    originIdea: result.idea,
    timeEstimateHours: result.analysis.timeEstimateHours,
    feasibility: result.analysis.feasibility,
  };
}

function inferDay(slot: string): "Mon" | "Wed" | "Fri" {
  const value = slot.toLowerCase();
  if (value.includes("monday") || value.includes("mon")) return "Mon";
  if (value.includes("wednesday") || value.includes("wed")) return "Wed";
  return "Fri";
}

function nextDateForDay(day: "Mon" | "Wed" | "Fri") {
  const targetDay = day === "Mon" ? 1 : day === "Wed" ? 3 : 5;
  const now = new Date();
  const result = new Date(now);
  const current = result.getDay();
  let delta = targetDay - current;
  if (delta <= 0) {
    delta += 7;
  }
  result.setDate(now.getDate() + delta);
  return result;
}

function getBrandBaseline() {
  if (typeof window === "undefined") {
    return {
      niche: "music creator",
      goals: "grow audience and streams",
      contentStyle: "authentic and performance-driven",
    };
  }

  const raw = localStorage.getItem(BASELINE_KEY);
  if (!raw) {
    return {
      niche: "music creator",
      goals: "grow audience and streams",
      contentStyle: "authentic and performance-driven",
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      niche?: string;
      goals?: string;
      contentStyle?: string;
    };

    return {
      niche: parsed.niche?.trim() || "music creator",
      goals: parsed.goals?.trim() || "grow audience and streams",
      contentStyle: parsed.contentStyle?.trim() || "authentic and performance-driven",
    };
  } catch {
    return {
      niche: "music creator",
      goals: "grow audience and streams",
      contentStyle: "authentic and performance-driven",
    };
  }
}

function getWeeklyHoursBudget() {
  if (typeof window === "undefined") {
    return 2;
  }

  const raw = localStorage.getItem(TIME_BUDGET_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

function normalizeTip(tip: string) {
  return tip.toLowerCase().replace(/\s+/g, " ").trim();
}

function commitAnalysisResult(input: {
  idea: string;
  analysis: IdeaAnalysis;
  persisted: PersistedState;
  setPersisted: React.Dispatch<React.SetStateAction<PersistedState>>;
  setRepeatTipNote: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const tipNormalized = normalizeTip(input.analysis.keepSimpleNote);
  const priorCount = (input.persisted.tipHistory ?? []).filter(
    (tip) => tip === tipNormalized,
  ).length;

  if (priorCount > 0) {
    input.setRepeatTipNote(
      `You have seen a similar simplification tip ${priorCount + 1} times.`,
    );
  } else {
    input.setRepeatTipNote(null);
  }

  input.setPersisted((prev) => ({
    ...prev,
    tipHistory: [...prev.tipHistory, tipNormalized].slice(-30),
  }));
}
