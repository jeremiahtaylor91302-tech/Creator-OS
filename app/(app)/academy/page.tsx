export default function AcademyPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Creator education
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Creator Academy</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          On the way. We are building this section now and will ship creator playbooks,
          examples, and practical systems soon.
        </p>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">What to expect</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border bg-surface p-4">
            <p className="text-sm font-semibold">Growth playbooks</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Repeatable frameworks for audience growth and better retention.
            </p>
          </article>
          <article className="rounded-xl border bg-surface p-4">
            <p className="text-sm font-semibold">Content systems</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Workflows for planning, filming, editing, and publishing consistently.
            </p>
          </article>
          <article className="rounded-xl border bg-surface p-4">
            <p className="text-sm font-semibold">Monetization lessons</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Practical guidance for turning content performance into revenue.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Status</h2>
        <p className="mt-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-muted-foreground">
          Creator Academy is in active development. You can keep using Dashboard,
          Direction, and Settings while this area is being built.
        </p>
      </section>
    </div>
  );
}
