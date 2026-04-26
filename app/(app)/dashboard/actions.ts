"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchYouTubeTopVideos } from "@/lib/analytics/youtube";
import { syncOnboardingCompletionState } from "@/lib/onboarding";

type BrandBaseline = {
  niche: string;
  goals: string;
  contentStyle: string;
};

type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

type IdeaAnalysis = {
  timeEstimateHours: number;
  feasibility: "green" | "yellow" | "red";
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

type ClarifyingTurnResult = {
  message: string;
  readyToAnalyze: boolean;
};

export async function getClarifyingTurn(input: {
  idea: string;
  conversation: ConversationTurn[];
  baseline: BrandBaseline;
  askedCount: number;
  weeklyHours: number;
}): Promise<ClarifyingTurnResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const transcript = input.conversation
    .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
    .join("\n");

  if (!apiKey) {
    if (input.askedCount >= 3) {
      return {
        message: "Got it, analyzing now...",
        readyToAnalyze: true,
      };
    }

    return {
      message:
        input.askedCount === 0
          ? "Quick one: is this a one-time post or something you want to turn into a recurring series?"
          : input.askedCount === 1
            ? "Nice. What setup do you need for this (gear, location, other people, props)?"
            : "Last one: what outcome matters most for this idea (streams, followers, comments, or something else)?",
      readyToAnalyze: false,
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: `
You are a smart creative producer helping a creator plan one content idea.
Goal: ask context-aware follow-up questions one-at-a-time, based on what the user already said.

Constraints:
- Ask 3 to 5 total follow-up questions max.
- Questions must reference details from the conversation when possible.
- Do NOT ask generic repeated questions.
- If enough context is gathered, transition naturally and say "Got it, analyzing now..." or very similar.

Creator baseline:
- Niche: ${input.baseline.niche}
- Goals: ${input.baseline.goals}
- Content style: ${input.baseline.contentStyle}
- Weekly available hours: ${input.weeklyHours}

Idea:
${input.idea}

Current asked count: ${input.askedCount}

Conversation so far:
${transcript || "No conversation yet."}

Return STRICT JSON only:
{
  "message": string,
  "readyToAnalyze": boolean
}
`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      message: "Got it, analyzing now...",
      readyToAnalyze: true,
    };
  }

  const payload = (await response.json()) as { output_text?: string };

  try {
    const parsed = JSON.parse(payload.output_text ?? "") as ClarifyingTurnResult;
    if (
      typeof parsed.message === "string" &&
      typeof parsed.readyToAnalyze === "boolean"
    ) {
      return parsed;
    }
  } catch {
    return {
      message: "Got it, analyzing now...",
      readyToAnalyze: true,
    };
  }

  return {
    message: "Got it, analyzing now...",
    readyToAnalyze: true,
  };
}

export async function analyzeIdea(input: {
  idea: string;
  conversation: ConversationTurn[];
  baseline: BrandBaseline;
  weeklyHours: number;
}): Promise<IdeaAnalysis> {
  const idea = input.idea?.trim() ?? "";
  if (!idea) {
    return {
      timeEstimateHours: 0,
      feasibility: "red",
      fitDecision: "Add a content idea to analyze feasibility.",
      suggestedSlot: "No slot suggested",
      difficulty: "Low",
      weekPlacement: "Week planning pending",
      keepSimpleNote:
        "Start with the easiest version: one take, no location changes, and publish a short clip first.",
      formatIdeas: [
        { format: "Talking head", timeMinutes: 20 },
        { format: "POV", timeMinutes: 25 },
      ],
      brandAlignment: {
        score: 0,
        explanation: "No idea entered yet.",
      },
      departureNote: null,
    };
  }

  const youtubeContext = await getYouTubeContextForCurrentUser();
  const transcript = input.conversation
    .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
    .join("\n");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackIdeaAnalysis(idea, input.baseline, input.weeklyHours);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: `
You are a creator operations assistant.
Analyze this content idea for a creator with only 2 hours available per week.
Content schedule slots are:
- Monday 7:00 PM
- Wednesday 7:00 PM
- Friday 6:30 PM

Idea: ${idea}
Creator niche baseline: ${input.baseline.niche}
Creator goals baseline: ${input.baseline.goals}
Creator content style baseline: ${input.baseline.contentStyle}
Weekly available hours: ${input.weeklyHours}

Clarifying answers:
${transcript || "No clarifying answers provided."}

Recent YouTube uploads:
${youtubeContext.recentTitles.join("\n") || "No data"}

Top-performing YouTube uploads:
${youtubeContext.topTitles.join("\n") || "No data"}

Return strict JSON only with this shape:
{
  "timeEstimateHours": number,
  "feasibility": "green" | "yellow" | "red",
  "fitDecision": string,
  "suggestedSlot": string,
  "difficulty": "Low" | "Medium" | "High",
  "weekPlacement": string,
  "keepSimpleNote": string,
  "formatIdeas": [
    { "format": string, "timeMinutes": number }
  ],
  "brandAlignment": {
    "score": number,
    "explanation": string
  },
  "departureNote": string | null
}
Rules:
- If <= ${input.weeklyHours} hours total effort, can fit this week.
- If > ${input.weeklyHours} hours, suggest later week placement.
- Keep fitDecision concise and practical.
- keepSimpleNote should be 1-2 sentences and explicitly explain lowest-effort version.
- formatIdeas must include 2-3 short-form formats with realistic production time.
- time estimate must factor setup complexity (location changes, props, costume, collaborators, editing load).
- brandAlignment.score should be 0-100 and based on baseline + YouTube context.
- If the idea is different from recent/top content, set departureNote with why it might still work or underperform.
`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return fallbackIdeaAnalysis(idea, input.baseline, input.weeklyHours);
  }

  const payload = (await response.json()) as { output_text?: string };

  try {
    const parsed = JSON.parse(payload.output_text ?? "") as IdeaAnalysis;
    if (
      typeof parsed.timeEstimateHours === "number" &&
      ["green", "yellow", "red"].includes(parsed.feasibility) &&
      typeof parsed.fitDecision === "string" &&
      typeof parsed.suggestedSlot === "string" &&
      ["Low", "Medium", "High"].includes(parsed.difficulty) &&
      typeof parsed.weekPlacement === "string" &&
      typeof parsed.keepSimpleNote === "string" &&
      Array.isArray(parsed.formatIdeas) &&
      parsed.brandAlignment &&
      typeof parsed.brandAlignment.score === "number" &&
      typeof parsed.brandAlignment.explanation === "string"
    ) {
      return parsed;
    }
  } catch {
    return fallbackIdeaAnalysis(idea, input.baseline, input.weeklyHours);
  }

  return fallbackIdeaAnalysis(idea, input.baseline, input.weeklyHours);
}

function fallbackIdeaAnalysis(
  idea: string,
  baseline: BrandBaseline,
  weeklyHours: number,
): IdeaAnalysis {
  const setupComplexity = estimateSetupComplexity(idea);
  const contentComplexity = Math.min(3, Math.ceil(idea.split(" ").length / 10));
  const complexityScore = Math.min(3, Math.max(setupComplexity, contentComplexity));
  const timeEstimateHours = estimateTimeHours(complexityScore, setupComplexity);
  const fitsThisWeek = timeEstimateHours <= weeklyHours;
  const alignment = estimateBrandAlignment(idea, baseline);

  return {
    timeEstimateHours,
    feasibility: fitsThisWeek ? (timeEstimateHours > 1.5 ? "yellow" : "green") : "red",
    fitDecision: fitsThisWeek
      ? `This can fit in your ${weeklyHours}-hour weekly budget.`
      : "This is too heavy for this week and should be scheduled later.",
    suggestedSlot: fitsThisWeek ? "Wednesday 7:00 PM" : "Friday 6:30 PM (prep week)",
    difficulty: complexityScore === 1 ? "Low" : complexityScore === 2 ? "Medium" : "High",
    weekPlacement: fitsThisWeek ? "This week" : "Week 2",
    keepSimpleNote:
      "Strip this down to one camera angle, one location, and minimal edits. Focus on a single hook and publish the shortest useful version first.",
    formatIdeas: suggestFormats(complexityScore),
    brandAlignment: {
      score: alignment.score,
      explanation: alignment.explanation,
    },
    departureNote: alignment.isDeparture
      ? "This is different from your recent content. It could work if you frame it as an experiment and keep execution tight."
      : null,
  };
}

function estimateSetupComplexity(idea: string) {
  const text = idea.toLowerCase();
  let score = 1;

  const highComplexityKeywords = [
    "collab",
    "collaboration",
    "multiple locations",
    "cinematic",
    "costume",
    "set design",
    "music video",
    "choreography",
    "performance with band",
  ];
  const mediumComplexityKeywords = [
    "b-roll",
    "tutorial",
    "breakdown",
    "reaction",
    "remix",
    "outfit",
    "storyline",
  ];

  if (highComplexityKeywords.some((keyword) => text.includes(keyword))) {
    score = 3;
  } else if (mediumComplexityKeywords.some((keyword) => text.includes(keyword))) {
    score = 2;
  }

  return score;
}

function estimateTimeHours(complexityScore: number, setupComplexity: number) {
  const base = complexityScore === 1 ? 0.9 : complexityScore === 2 ? 1.6 : 2.4;
  const setupLift = setupComplexity === 3 ? 0.5 : setupComplexity === 2 ? 0.25 : 0;
  return Number((base + setupLift).toFixed(1));
}

function suggestFormats(complexityScore: number) {
  if (complexityScore >= 3) {
    return [
      { format: "POV quick take", timeMinutes: 35 },
      { format: "Talking head + one cutaway", timeMinutes: 45 },
      { format: "Day-in-the-life mini clip", timeMinutes: 55 },
    ];
  }

  if (complexityScore === 2) {
    return [
      { format: "Talking head", timeMinutes: 25 },
      { format: "POV", timeMinutes: 30 },
      { format: "Stitch / duet response", timeMinutes: 35 },
    ];
  }

  return [
    { format: "One-take POV", timeMinutes: 15 },
    { format: "Quick talking head", timeMinutes: 20 },
  ];
}

async function getYouTubeContextForCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { recentTitles: [] as string[], topTitles: [] as string[] };
    }

    const { data: connection } = await supabase
      .from("platform_connections")
      .select("access_token,status")
      .eq("user_id", user.id)
      .eq("platform", "youtube")
      .maybeSingle();

    if (!connection?.access_token || connection.status !== "connected") {
      return { recentTitles: [] as string[], topTitles: [] as string[] };
    }

    const videos = await fetchYouTubeTopVideos(connection.access_token, 12);
    const topTitles = videos.slice(0, 5).map((video) => `- ${video.title}`);
    const recentTitles = [...videos]
      .sort((a, b) => {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map((video) => `- ${video.title}`);

    return { recentTitles, topTitles };
  } catch {
    return { recentTitles: [] as string[], topTitles: [] as string[] };
  }
}

function estimateBrandAlignment(idea: string, baseline: BrandBaseline) {
  const ideaTokens = tokenize(idea);
  const baselineTokens = tokenize(
    `${baseline.niche} ${baseline.goals} ${baseline.contentStyle}`,
  );

  const overlap = [...ideaTokens].filter((token) => baselineTokens.has(token)).length;
  const score = Math.min(95, Math.max(35, 35 + overlap * 12));
  const isDeparture = score < 55;

  return {
    score,
    explanation: isDeparture
      ? "Lower alignment with your stated niche/style, but it can still work as a strategic test."
      : "Strong match with your niche, goals, and content style baseline.",
    isDeparture,
  };
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
}

export async function registerDashboardOnboardingVisit() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const };
  }

  const { data: row } = await supabase
    .from("profiles")
    .select("onboarding_completed, onboarding_dashboard_visits")
    .eq("id", user.id)
    .maybeSingle();

  if (!row || row.onboarding_completed) {
    return { ok: true as const };
  }

  const nextVisits = (Number(row.onboarding_dashboard_visits) || 0) + 1;

  await supabase
    .from("profiles")
    .update({ onboarding_dashboard_visits: nextVisits })
    .eq("id", user.id);

  await syncOnboardingCompletionState(user.id);
  return { ok: true as const };
}

export async function addDashboardOnboardingSeconds(deltaSeconds: number) {
  const safeDelta = Math.min(120, Math.max(0, Math.floor(deltaSeconds)));
  if (safeDelta === 0) {
    return { ok: true as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const };
  }

  const { data: row } = await supabase
    .from("profiles")
    .select("onboarding_completed, onboarding_dashboard_seconds")
    .eq("id", user.id)
    .maybeSingle();

  if (!row || row.onboarding_completed) {
    return { ok: true as const };
  }

  const nextSeconds = Math.min(
    86400,
    (Number(row.onboarding_dashboard_seconds) || 0) + safeDelta,
  );

  await supabase
    .from("profiles")
    .update({ onboarding_dashboard_seconds: nextSeconds })
    .eq("id", user.id);

  await syncOnboardingCompletionState(user.id);
  return { ok: true as const };
}

export async function recordFirstContentIdeaSubmitted() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const };
  }

  const { data: row } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!row || row.onboarding_completed) {
    return { ok: true as const };
  }

  await supabase
    .from("profiles")
    .update({ onboarding_step_idea: true })
    .eq("id", user.id);

  await syncOnboardingCompletionState(user.id);
  return { ok: true as const };
}
