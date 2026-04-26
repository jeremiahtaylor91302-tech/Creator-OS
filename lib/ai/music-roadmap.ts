type RoadmapInput = {
  direction: string;
  audience: string;
  cadence: string;
  strengths: string;
  goals: string;
};

function buildFallbackRoadmap(input: RoadmapInput) {
  return `# 90-Day ${input.direction} Growth Roadmap

## North Star
Turn your ${input.strengths.toLowerCase()} into content that grows your audience and helps you hit ${input.goals.toLowerCase()}.

## Month 1 - Positioning + Consistency
- Pick 3 repeatable content types your audience (${input.audience}) actually wants.
- Post on a realistic schedule (${input.cadence}) and keep it consistent for 4 weeks.
- End every video with one clear action (comment, save, or stream your song).

## Month 2 - Scale Winners
- Review your top 5 videos and identify what topic, hook, and format performed best.
- Turn your best concept into a weekly series.
- Improve titles and thumbnails based on what already works.

## Month 3 - Conversion + Community
- Push listeners from short videos to full songs and streaming links.
- Run one audience challenge (covers, duets, or comment prompts).
- Do at least one collaboration with a creator in your lane.

## Weekly KPI Targets
- Consistency: hit your planned posting schedule every week.
- Engagement: improve comments and saves by testing stronger hooks.
- Conversion: track clicks from content to your streaming platforms.
`;
}

export async function generateMusicRoadmap(input: RoadmapInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  const fallbackRoadmap = buildFallbackRoadmap(input);

  if (!apiKey) {
    return fallbackRoadmap;
  }

  const prompt = `
You are a senior music content strategist. Speak in plain, normal language.
Create a concise and actionable 90-day creator roadmap.

Direction: ${input.direction}
Audience: ${input.audience}
Cadence preference: ${input.cadence}
Current strengths: ${input.strengths}
Primary goals: ${input.goals}

Output requirements:
- Use markdown headings EXACTLY in this format:
## North Star
## Month 1
## Month 2
## Month 3
## Weekly KPI Targets
- Under Month sections, include 3 short bullet items each.
- Under Weekly KPI Targets include exactly 3 bullet items with "Label: value" format.
- Tactical, specific steps (not generic motivation)
- Focus on content strategy, audience growth, and measurable execution.
- Avoid buzzwords like "artist-story content". Keep language clear and direct.
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return fallbackRoadmap;
  }

  const data = (await response.json()) as {
    output_text?: string;
  };

  return data.output_text?.trim() || fallbackRoadmap;
}
