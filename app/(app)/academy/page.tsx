import { TrainingCompliance } from "@/components/training-compliance";

const creatorSpotlights = [
  {
    creator: "Ari Lane",
    niche: "Indie pop artist",
    lesson: "Posted one songwriting short daily for 60 days, then bundled top hooks into full-track drops.",
    growth: "+180% subscriber growth in 3 months",
  },
  {
    creator: "Nova Rae",
    niche: "Live-loop performer",
    lesson: "Used performance-first thumbnails and pinned comments to convert casual viewers into streaming listeners.",
    growth: "+92% stream click-through rate lift",
  },
  {
    creator: "Kai Bloom",
    niche: "Bedroom producer",
    lesson: "Turned one recurring format into a weekly series and stopped posting off-brand experiments.",
    growth: "+2.4x average views per upload",
  },
];

const internalCurriculum = [
  "Module 1 - Positioning your artist identity for algorithm + audience fit",
  "Module 2 - Hooks, intros, and retention scripting for music creators",
  "Module 3 - Thumbnail and title systems that improve click-through",
  "Module 4 - Turning short-form engagement into song streams",
  "Module 5 - Live performance content and monetization path",
];

export default function AcademyPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Internal training
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Creator Academy</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Learn directly from high-performing creators and adapt their frameworks to
          your own growth path.
        </p>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Internal video curriculum</h2>
        <div className="mt-4 space-y-2">
          {internalCurriculum.map((module) => (
            <div
              key={module}
              className="rounded-xl border bg-surface px-3 py-2 text-sm text-muted-foreground"
            >
              {module}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Top creator growth paths</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {creatorSpotlights.map((story) => (
            <article key={story.creator} className="rounded-xl border bg-surface p-4">
              <p className="text-sm font-semibold">{story.creator}</p>
              <p className="mt-1 text-xs text-muted-foreground">{story.niche}</p>
              <p className="mt-3 text-xs text-muted-foreground">{story.lesson}</p>
              <p className="mt-3 text-xs font-semibold text-accent">{story.growth}</p>
            </article>
          ))}
        </div>
      </section>

      <TrainingCompliance />
    </div>
  );
}
