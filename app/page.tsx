import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const signInHref = (isVisitorView: boolean) =>
  `/auth/sign-in${isVisitorView ? "?next=/" : ""}`;

export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);
  const isVisitorView = searchParams.visitor === "1";
  const publicSuffix = isVisitorView ? "?visitor=1" : "";

  const ctaHref = isLoggedIn ? "/dashboard" : signInHref(isVisitorView);

  const whatYouGet = [
    {
      title: "Content planning",
      body: "Plan what to post and when, without the spreadsheet chaos.",
    },
    {
      title: "Platform connections",
      body: "Connect YouTube, TikTok, Instagram, Twitter/X and see everything in one place.",
    },
    {
      title: "Smart direction",
      body: "Set your creative goals and get a system that keeps you on track.",
    },
    {
      title: "Time-aware scheduling",
      body: "Built for creators with 2 hours a week, not 20.",
    },
  ] as const;

  return (
    <main className="flex min-h-screen max-w-[100vw] flex-col overflow-x-clip px-4 pb-12 pt-5 sm:px-5 sm:pb-14 sm:pt-7 md:px-8 md:pb-16 md:pt-10">
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col gap-10 sm:max-w-3xl sm:gap-12 md:max-w-4xl">
        <LandingHeader
          publicSuffix={publicSuffix}
          isLoggedIn={isLoggedIn}
          isVisitorView={isVisitorView}
        />

        {/* Hero — single column, phone-first */}
        <section className="flex min-w-0 flex-col gap-5 rounded-2xl border bg-gradient-to-b from-surface to-surface-muted px-5 py-8 sm:rounded-3xl sm:px-8 sm:py-10 md:py-12">
          <h1 className="text-balance text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl md:leading-tight">
            The world&apos;s better when we make art.
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Creator OS is the system behind your content — so you can stop guessing and start building.
            Free. No credit card. No waitlist.
          </p>
          <div className="pt-1">
            <Link
              href={ctaHref}
              className="inline-flex h-12 w-full min-w-0 items-center justify-center rounded-xl bg-accent px-6 text-base font-semibold text-black shadow-sm transition hover:bg-accent-strong active:scale-[0.99] sm:h-12 sm:max-w-xs"
            >
              Start Building
            </Link>
          </div>
        </section>

        {/* What you get */}
        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              What you get
            </p>
            <h2 className="text-balance text-xl font-semibold sm:text-2xl">
              For musicians, cover artists, students, and parents building between everything else
            </h2>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {whatYouGet.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5"
              >
                <h3 className="text-base font-semibold text-foreground sm:text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Closing CTA */}
        <section className="flex justify-center rounded-2xl border border-accent/20 bg-black/35 px-5 py-8 sm:rounded-3xl sm:py-10">
          <Link
            href={ctaHref}
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-strong px-6 text-base font-semibold text-white transition hover:opacity-95 active:scale-[0.99]"
          >
            Start Building
          </Link>
        </section>
      </div>

      <LandingFooter publicSuffix={publicSuffix} />
    </main>
  );
}
