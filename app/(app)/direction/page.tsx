import { RoadmapGenerator } from "@/components/roadmap-generator";

export default function DirectionPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Bigger picture</p>
        <h1 className="mt-1 text-2xl font-semibold">Music Direction Roadmap</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate a focused plan to take your music creator journey to the next level.
        </p>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <RoadmapGenerator />
      </section>
    </div>
  );
}
