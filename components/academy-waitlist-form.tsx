"use client";

import { useState, useTransition } from "react";
import { joinAcademyWaitlist } from "@/app/(app)/academy/actions";

export function AcademyWaitlistForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        You&apos;re on the list.
      </p>
    );
  }

  return (
    <form
      className="mt-4 flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        startTransition(async () => {
          const result = await joinAcademyWaitlist(email);
          if (!result.ok) {
            setError(result.error ?? "Could not join waitlist.");
            return;
          }
          setSubmitted(true);
          setEmail("");
        });
      }}
    >
      <label className="sr-only" htmlFor="academy_waitlist_email">
        Email address
      </label>
      <input
        id="academy_waitlist_email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="h-12 w-full rounded-xl border bg-surface px-4 text-sm outline-none ring-accent/30 placeholder:text-muted-foreground focus:ring"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-strong px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Notify Me"}
      </button>
      {error ? (
        <p className="sm:basis-full text-xs text-rose-300">{error}</p>
      ) : null}
    </form>
  );
}
