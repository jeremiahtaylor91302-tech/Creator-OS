"use server";

import { generateMusicRoadmap } from "@/lib/ai/music-roadmap";

export async function createRoadmap(formData: FormData) {
  const direction = formData.get("direction")?.toString().trim() || "Music";
  const audience =
    formData.get("audience")?.toString().trim() ||
    "Independent music listeners and aspiring artists";
  const cadenceInput = formData.get("cadence")?.toString().trim() || "";
  const cadence = normalizeCadence(cadenceInput);
  const strengths =
    formData.get("strengths")?.toString().trim() ||
    "Authentic storytelling and consistent posting";
  const goals =
    formData.get("goals")?.toString().trim() ||
    "Grow subscribers, increase repeat viewers, and build loyal music community";

  const roadmap = await generateMusicRoadmap({
    direction,
    audience,
    cadence,
    strengths,
    goals,
  });

  return roadmap;
}

function normalizeCadence(cadence: string) {
  if (!cadence) {
    return "3 uploads per week";
  }

  const value = cadence.toLowerCase().trim();
  if (["idk", "i don't know", "dont know", "not sure", "unsure"].includes(value)) {
    return "2 to 3 uploads per week";
  }

  return cadence;
}
