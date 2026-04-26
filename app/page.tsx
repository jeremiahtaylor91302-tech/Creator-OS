import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);
  const isVisitorView = searchParams.visitor === "1";
  const showLoggedInNav = isLoggedIn && !isVisitorView;
  const publicSuffix = isVisitorView ? "?visitor=1" : "";

  return (
    <main className="min-h-screen px-6 py-12 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex items-center justify-between rounded-2xl border bg-surface/70 p-5 backdrop-blur">
          <div>
            <p className="text-sm text-muted-foreground">Creator dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tight">Creator OS</h1>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href={`/pricing${publicSuffix}`}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href={`/careers${publicSuffix}`}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Careers
            </Link>
            {!showLoggedInNav && (
              <Link
                href={`/auth/sign-in${isVisitorView ? "?next=/" : ""}`}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Sign in
              </Link>
            )}
            {isLoggedIn && (
              <Link
                href={isVisitorView ? "/" : "/?visitor=1"}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {isVisitorView ? "Exit visitor view" : "View as visitor"}
              </Link>
            )}
            <Link
              href={showLoggedInNav ? "/dashboard" : `/pricing${publicSuffix}`}
              className="rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {showLoggedInNav ? "Go to dashboard" : "Get started"}
            </Link>
          </div>
        </header>

        <section className="grid gap-6 rounded-3xl border bg-gradient-to-br from-surface to-surface-muted p-8 md:grid-cols-2 md:p-12">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              Unified creator analytics
            </p>
            <h2 className="text-4xl font-semibold tracking-tight">
              Stop losing to the algorithm because life got busy.
            </h2>
            <p className="text-muted-foreground">
              Your content career shouldn&apos;t depend on whether you had a good week.
            </p>
            <div className="flex gap-3">
              <Link
                href="/auth/sign-in"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-strong"
              >
                Get started
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/5"
              >
                Preview app shell
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["YouTube", "TikTok", "Instagram", "Twitter/X", "Podcasts"].map((platform) => (
              <div
                key={platform}
                className="rounded-2xl border bg-background/70 p-4 text-sm"
              >
                <p className="text-muted-foreground">Platform</p>
                <p className="mt-1 font-medium">{platform}</p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Connect to unlock audience and engagement metrics.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Features</p>
            <h3 className="mt-2 text-2xl font-semibold">What Creator OS helps you do</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: "🧩",
                title: "All your platforms in one place",
                description:
                  "See every channel side by side without bouncing between apps.",
              },
              {
                icon: "✨",
                title: "AI that fits ideas to your schedule",
                description:
                  "Get idea support that adapts to your real weekly availability.",
              },
              {
                icon: "📈",
                title: "Know what's working before you post again",
                description:
                  "Spot winning patterns fast so your next post is sharper.",
              },
            ].map((feature) => (
              <article key={feature.title} className="rounded-2xl border bg-surface p-6">
                <div className="inline-flex rounded-md border bg-surface-muted px-2.5 py-1.5 text-base">
                  {feature.icon}
                </div>
                <h4 className="mt-4 text-lg font-semibold">{feature.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-accent/25 bg-surface-muted/70 px-4 py-4 text-center text-base text-muted-foreground">
          Built in public by a creator with 215k followers and still burned out — now rebuilding with a system that makes consistency possible again.
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">From the blog</p>
            <h3 className="mt-2 text-2xl font-semibold">Learn the playbook behind the product</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "How I grew to 215k on TikTok working 2 hours a week",
                category: "Growth",
                date: "Apr 2026",
              },
              {
                title: "Why consistency beats talent for creators",
                category: "Mindset",
                date: "Apr 2026",
              },
              {
                title: "The system I built to never miss a post again",
                category: "Systems",
                date: "Apr 2026",
              },
            ].map((post) => (
              <article key={post.title} className="rounded-2xl border bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                </div>
                <h4 className="mt-3 text-base font-semibold">{post.title}</h4>
                <Link
                  href="#"
                  className="mt-4 inline-flex text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Read more
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-black/45 p-8 md:p-10">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h3 className="max-w-xl text-2xl font-semibold">
              Ready to stop disappearing on your audience?
            </h3>
            <Link
              href="/pricing"
              className="rounded-lg bg-gradient-to-r from-accent to-accent-strong px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Get lifetime access for $59
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
