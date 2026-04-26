import { AcademyWaitlistForm } from "@/components/academy-waitlist-form";

export default function AcademyPage() {
  const modules = [
    "Module 1 - Positioning your artist identity for algorithm + audience fit",
    "Module 2 - Hooks, intros, and retention scripting for music creators",
    "Module 3 - Thumbnail and title systems that improve click-through",
    "Module 4 - Turning short-form engagement into song streams",
    "Module 5 - Live performance content and monetization path",
  ];

  const stories = [
    {
      creator: "Ari Lane",
      context: "Indie pop artist",
      summary:
        "Was posting daily with no strategy. Burned out in 3 months. Came back with a system and grew 10x in 60 days.",
    },
    {
      creator: "Nova Rae",
      context: "Live-loop performer and full-time student",
      summary:
        "Had 45 minutes a day to create. Built a thumbnail-first workflow that cut editing time in half.",
    },
    {
      creator: "Kai Bloom",
      context: "Bedroom producer and single mom",
      summary:
        "Stopped chasing trends, started a weekly series, and turned 200 followers into a real audience.",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Creator education
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Creator Academy</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Built for creators who are tired of guessing what works. For the creator posting
          between classes, after the kids are asleep, or on the edge of burnout.
        </p>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Curriculum preview</h2>
        <div className="mt-4 space-y-2">
          {modules.map((module) => (
            <div
              key={module}
              className="group flex items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 transition hover:border-accent/45 hover:bg-surface-muted/60"
              title="Available when Creator Academy launches"
            >
              <p className="text-sm text-foreground">{module}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100">
                  Available when Creator Academy launches
                </span>
                <LockIcon />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Real creator stories</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {stories.map((story) => (
            <article key={story.creator} className="rounded-xl border bg-surface p-4">
              <p className="text-sm font-semibold">{story.creator}</p>
              <p className="mt-1 text-xs text-muted-foreground">{story.context}</p>
              <p className="mt-3 text-sm text-muted-foreground">{story.summary}</p>
              <p className="mt-3 text-xs font-semibold text-accent">
                Full stories inside Creator Academy
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Be the first to know when Creator Academy drops</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll send you one email. That&apos;s it. No spam, no drip sequence, no upsell marathon.
        </p>
        <AcademyWaitlistForm />
      </section>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}
