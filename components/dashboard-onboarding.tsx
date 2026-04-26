"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { OauthConnectLink } from "@/components/oauth-connect-link";
import {
  addDashboardOnboardingSeconds,
  registerDashboardOnboardingVisit,
} from "@/app/(app)/dashboard/actions";

export type OnboardingStepState = {
  id: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
};

export function DashboardOnboardingExploreTracker() {
  const router = useRouter();
  const visitRecorded = useRef(false);

  useEffect(() => {
    if (visitRecorded.current) {
      return;
    }
    visitRecorded.current = true;

    void (async () => {
      await registerDashboardOnboardingVisit();
      router.refresh();
    })();

    const interval = window.setInterval(() => {
      void (async () => {
        await addDashboardOnboardingSeconds(12);
        router.refresh();
      })();
    }, 12000);

    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}

export function DashboardOnboardingChecklist({
  steps,
  completedCount,
  pauseProgressTracking = false,
}: {
  steps: OnboardingStepState[];
  completedCount: number;
  /** When true, do not record visits or time toward onboarding (e.g. owner "new user" preview). */
  pauseProgressTracking?: boolean;
}) {
  const total = steps.length;

  return (
    <section className="rounded-2xl border border-accent/25 bg-gradient-to-br from-surface to-surface-muted p-5 sm:p-6">
      {pauseProgressTracking ? null : <DashboardOnboardingExploreTracker />}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            {completedCount} of {total} complete
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Let&apos;s get you set up
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Complete these steps to activate your Creator OS.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-xl border border-border/80 bg-background/40 px-3 py-3 sm:items-center sm:px-4"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs sm:mt-0 ${
                step.done
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                  : "border-border bg-surface-muted text-muted-foreground"
              }`}
              aria-hidden="true"
            >
              {step.done ? "✓" : ""}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${step.done ? "text-muted-foreground" : "text-foreground"}`}>
                {step.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
            </div>
            {step.href.startsWith("/oauth/") ? (
              <OauthConnectLink
                href={step.href}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-foreground no-underline transition hover:border-accent/40 hover:bg-accent/10"
              >
                Go
                <span aria-hidden="true" className="text-accent">
                  →
                </span>
              </OauthConnectLink>
            ) : (
              <Link
                href={step.href}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:bg-accent/10"
              >
                Go
                <span aria-hidden="true" className="text-accent">
                  →
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
