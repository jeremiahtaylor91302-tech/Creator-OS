import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
              Built for musicians and short-form creators
            </p>
            <h2 className="text-balance text-[1.35rem] font-semibold leading-snug tracking-tight sm:text-2xl sm:leading-tight md:text-4xl md:leading-tight">
              The world&apos;s better when we make art.
            </h2>
            <p className="text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              Creator OS gives you the system so you can focus on the creating. No credit card. No waitlist. Just start building.
            </p>
            <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:gap-3">
              <Link
                href={`/auth/sign-in${isVisitorView ? "?next=/" : ""}`}
                className="inline-flex h-12 w-full min-w-0 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-black transition hover:bg-accent-strong active:scale-[0.99] md:h-auto md:w-auto md:rounded-lg md:py-2"
              >
                Start Building - It&apos;s Free
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
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                  Connect and create without jumping between tools.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 sm:space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">What you get</p>
            <h3 className="mt-2 text-balance text-lg font-semibold sm:text-xl md:text-2xl">
              Everything you need to stay in your creative flow
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {[
              {
                icon: "🗓️",
                title: "Content planning",
              },
              {
                icon: "🔌",
                title: "Platform connections",
              },
              {
                icon: "🎬",
                title: "Video idea pipeline",
              },
              {
                icon: "📊",
                title: "Analytics dashboard",
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
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-black/45 p-5 sm:rounded-3xl sm:p-8 md:p-10">
          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
            <h3 className="max-w-xl text-balance text-lg font-semibold leading-snug sm:text-xl md:text-2xl">
              Keep making. Keep sharing. We&apos;ll handle the system.
            </h3>
            <Link
              href={`/auth/sign-in${isVisitorView ? "?next=/" : ""}`}
              className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-strong px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99] md:h-auto md:w-auto md:rounded-lg md:py-3 md:active:scale-100"
            >
              Start Building - It&apos;s Free
            </Link>
          </div>
        </section>
      </div>

      <LandingFooter publicSuffix={publicSuffix} />
    </main>
  );
}
