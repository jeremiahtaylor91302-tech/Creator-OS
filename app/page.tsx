import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { blogPostSummaries } from "@/lib/blog/posts";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";

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
    <main className="flex min-h-screen max-w-[100vw] flex-col overflow-x-clip px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 md:px-10 md:pb-14 md:pt-12">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 md:gap-12">
        <LandingHeader
          publicSuffix={publicSuffix}
          showLoggedInNav={showLoggedInNav}
          isLoggedIn={isLoggedIn}
          isVisitorView={isVisitorView}
        />

        <section className="flex min-w-0 flex-col gap-5 overflow-x-clip rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-5 sm:gap-8 sm:rounded-3xl sm:p-6 md:grid md:grid-cols-2 md:gap-10 md:p-12">
          <div className="min-w-0 space-y-4 md:space-y-5">
            <p className="inline-flex rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent sm:text-xs">
              Unified creator analytics
            </p>
            <h2 className="text-balance text-[1.35rem] font-semibold leading-snug tracking-tight sm:text-2xl sm:leading-tight md:text-4xl md:leading-tight">
              Stop losing to the algorithm because life got busy.
            </h2>
            <p className="text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              Your content career shouldn&apos;t depend on whether you had a good week.
            </p>
            <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:gap-3">
              <Link
                href="/auth/sign-in"
                className="inline-flex h-12 w-full min-w-0 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-black transition hover:bg-accent-strong active:scale-[0.99] md:h-auto md:w-auto md:rounded-lg md:py-2"
              >
                Get started
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 w-full min-w-0 items-center justify-center rounded-xl border border-border bg-background/40 px-4 text-sm font-semibold text-foreground transition hover:bg-white/5 active:scale-[0.99] md:h-auto md:w-auto md:rounded-lg md:py-2"
              >
                Preview app shell
              </Link>
            </div>
          </div>
          <div className="grid min-w-0 w-full grid-cols-2 gap-2.5 md:grid-cols-1 lg:grid-cols-2">
            {["YouTube", "TikTok", "Instagram", "Twitter/X", "Podcasts"].map((platform) => (
              <div
                key={platform}
                className="flex min-h-0 min-w-0 flex-col rounded-xl border border-border/80 bg-background/80 p-2.5 sm:rounded-2xl sm:p-4"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                  Platform
                </p>
                <p className="mt-1 text-sm font-semibold leading-tight sm:text-base">{platform}</p>
                <p className="mt-2 hidden text-[11px] leading-snug text-muted-foreground sm:block sm:text-xs">
                  Connect to unlock audience and engagement metrics.
                </p>
                <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground sm:hidden">
                  Tap Connect in the app for metrics.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 sm:space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Features</p>
            <h3 className="mt-2 text-balance text-lg font-semibold sm:text-xl md:text-2xl">
              What Creator OS helps you do
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
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
              <article
                key={feature.title}
                className="rounded-xl border border-border/80 bg-surface p-4 sm:rounded-2xl sm:p-6"
              >
                <div className="inline-flex rounded-md border bg-surface-muted px-2.5 py-1.5 text-base">
                  {feature.icon}
                </div>
                <h4 className="mt-3 text-balance text-[0.95rem] font-semibold leading-snug sm:mt-4 sm:text-lg">
                  {feature.title}
                </h4>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-accent/25 bg-surface-muted/70 px-4 py-4 text-left text-sm leading-relaxed text-muted-foreground sm:px-5 sm:text-center sm:text-base">
          Built in public by a creator with 215k followers and still burned out — now rebuilding with a system that makes consistency possible again.
        </section>

        <section className="space-y-4 sm:space-y-5">
          <div className="hidden md:block">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">From the blog</p>
            <h3 className="mt-2 text-balance text-lg font-semibold sm:text-xl md:text-2xl">
              Learn the playbook behind the product
            </h3>
          </div>
          <Link
            href={`/blog${publicSuffix}`}
            className="inline-flex min-h-[52px] w-full items-center gap-2 rounded-xl border border-border/80 bg-surface/80 px-4 py-3 text-sm font-semibold text-foreground no-underline transition hover:border-accent/40 hover:bg-surface-muted/50 md:hidden"
          >
            From the blog <span className="text-accent">→</span>
          </Link>
          <div className="hidden grid-cols-1 gap-3 sm:gap-4 md:grid md:grid-cols-3">
            {blogPostSummaries.map((post) => {
              const href = `/blog/${post.slug}`;
              return (
                <a
                  key={post.slug}
                  href={href}
                  className="group block rounded-xl border border-border/80 bg-surface p-4 no-underline transition hover:border-accent/50 hover:bg-surface-muted/60 active:scale-[0.99] sm:rounded-2xl sm:p-5 md:active:scale-100"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{post.readTimeMinutes} min read</p>
                  <h4 className="mt-3 text-balance text-sm font-semibold leading-snug text-foreground group-hover:text-accent sm:text-base">
                    {post.title}
                  </h4>
                  <span className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-accent/10 py-2.5 text-sm font-semibold text-accent transition group-hover:bg-accent/15 sm:justify-start sm:bg-transparent sm:py-2 sm:text-left sm:group-hover:bg-accent/5">
                    Read more
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border bg-black/45 p-5 sm:rounded-3xl sm:p-8 md:p-10">
          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
            <h3 className="max-w-xl text-balance text-lg font-semibold leading-snug sm:text-xl md:text-2xl">
              Ready to stop disappearing on your audience?
            </h3>
            <Link
              href={`/pricing${publicSuffix}`}
              className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-strong px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99] md:h-auto md:w-auto md:rounded-lg md:py-3 md:active:scale-100"
            >
              Get lifetime access for $59
            </Link>
          </div>
        </section>
      </div>

      <LandingFooter publicSuffix={publicSuffix} />
    </main>
  );
}
