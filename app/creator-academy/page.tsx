import Link from "next/link";

const publicTips = [
  {
    title: "Build one repeatable weekly series",
    body: "Growth gets easier when viewers know what kind of content to expect from you every week.",
  },
  {
    title: "Write stronger first 10 seconds",
    body: "Your opening line should create curiosity immediately and make people stay for the payoff.",
  },
  {
    title: "Optimize for stream conversion, not only views",
    body: "Use direct CTAs and pinned comments to move fans from content into your songs and offers.",
  },
  {
    title: "Track winners, cut experiments quickly",
    body: "Double down on formats that retain viewers and retire ideas that underperform for 3+ uploads.",
  },
];

export default function CreatorAcademyPublicPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="rounded-3xl border bg-gradient-to-br from-surface to-surface-muted p-8">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Public resource
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Creator Academy</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Open growth insights for creators building stronger content systems.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/auth/sign-in"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Join Creator OS
            </Link>
            <Link
              href="/"
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Back home
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {publicTips.map((tip) => (
            <article key={tip.title} className="rounded-2xl border bg-surface p-5">
              <h2 className="text-lg font-semibold">{tip.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tip.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
