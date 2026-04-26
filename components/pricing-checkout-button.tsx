"use client";

import { useState } from "react";

export function PricingCheckoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          setError(null);
          setIsLoading(true);
          try {
            const response = await fetch("/api/payments/lemon/checkout", {
              method: "POST",
            });
            const payload = (await response.json()) as { url?: string; error?: string };

            if (!response.ok || !payload.url) {
              throw new Error(payload.error ?? "Unable to start checkout.");
            }

            window.location.href = payload.url;
          } catch (checkoutError) {
            setError(
              checkoutError instanceof Error
                ? checkoutError.message
                : "Unable to start checkout.",
            );
            setIsLoading(false);
          }
        }}
        className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {isLoading ? "Opening checkout..." : "Get lifetime access for $59"}
      </button>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
