import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessApp } from "@/lib/access";
import { PricingCheckoutButton } from "@/components/pricing-checkout-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PricingPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const isVisitorView = searchParams.visitor === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isVisitorView && user && (await canAccessApp(user.id, user.email))) {
    redirect("/dashboard");
  }

  const viewerUser = isVisitorView ? null : user;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <section className="rounded-3xl border bg-surface/85 p-8 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Creator OS pricing
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Stop losing to the algorithm because you ran out of time.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Creator OS helps you plan what to post, when to post it, and how to stay consistent
            without burning out.
          </p>

          <p className="mt-4 text-xs text-muted-foreground">
            Built by a creator with 215k followers who had zero time. Now you don&apos;t need
            it either.
          </p>

          <div className="mt-6 rounded-2xl border bg-surface-muted/70 p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">Lifetime deal</p>
                <p className="text-xs text-muted-foreground">Pay once, use forever.</p>
              </div>
              <p className="text-3xl font-semibold">$59</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                - You post with a weekly game plan instead of wasting hours deciding what to film.
              </li>
              <li>
                - You turn two free hours into finished content instead of half-edited drafts that
                never get posted.
              </li>
              <li>
                - You post when inspiration hits instead of disappearing for weeks and losing
                momentum.
              </li>
            </ul>
            <div className="mt-5">
              {viewerUser ? (
                <PricingCheckoutButton />
              ) : (
                <Link
                  href="/auth/sign-in?next=/pricing"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Sign in to get lifetime access for $59
                </Link>
              )}
              <p className="mt-2 text-center text-xs text-muted-foreground">
                No subscription. No trial. Pay once, own it forever.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
