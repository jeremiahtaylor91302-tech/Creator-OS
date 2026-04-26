"use client";

import { VoiceDictationButton } from "@/components/voice-dictation-button";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

type Tab = "feature" | "bug";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("feature");
  const [featureMessage, setFeatureMessage] = useState("");
  const [bugMessage, setBugMessage] = useState("");
  const [bugPage, setBugPage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return pathname ?? "/";
    return window.location.href;
  }, [pathname]);

  const appendFeature = useCallback((snippet: string) => {
    const t = snippet.trim();
    if (!t) return;
    setFeatureMessage((prev) => (!prev.trim() ? t : `${prev.trimEnd()} ${t}`));
  }, []);

  const appendBug = useCallback((snippet: string) => {
    const t = snippet.trim();
    if (!t) return;
    setBugMessage((prev) => (!prev.trim() ? t : `${prev.trimEnd()} ${t}`));
  }, []);

  async function submitFeature() {
    const message = featureMessage.trim();
    if (!message) return;
    setIsSubmitting(true);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "feature",
        message,
        page_url: pageUrl,
      }),
    });
    setIsSubmitting(false);
    if (!response.ok) return;
    setFeatureMessage("");
    setConfirmation("Got it — thank you.");
    setOpen(false);
  }

  async function submitBug() {
    const message = bugMessage.trim();
    if (!message) return;
    setIsSubmitting(true);
    const where = bugPage.trim() || pageUrl;
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "bug",
        message: `${message}${where ? `\n\nPage: ${where}` : ""}`,
        page_url: where,
      }),
    });
    setIsSubmitting(false);
    if (!response.ok) return;
    setBugMessage("");
    setBugPage("");
    setConfirmation("Got it — thank you.");
    setOpen(false);
  }

  return (
    <>
      {confirmation && (
        <div className="fixed bottom-20 right-4 z-50 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 shadow-lg">
          {confirmation}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setConfirmation(null);
          setOpen((prev) => !prev);
        }}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
      >
        <span aria-hidden="true">💬</span>
        Feedback
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[min(92vw,360px)] rounded-2xl border bg-surface p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Share feedback</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground transition hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="mt-3 inline-flex rounded-lg border bg-surface-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setTab("feature")}
              className={`rounded-md px-3 py-1.5 transition ${
                tab === "feature"
                  ? "bg-accent text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Feature Request
            </button>
            <button
              type="button"
              onClick={() => setTab("bug")}
              className={`rounded-md px-3 py-1.5 transition ${
                tab === "bug"
                  ? "bg-accent text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bug Report
            </button>
          </div>

          {tab === "feature" ? (
            <div className="mt-3 space-y-3">
              <label className="space-y-1 text-xs text-muted-foreground">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0 pt-0.5">What would make Creator OS better for you?</span>
                  <VoiceDictationButton onAppend={appendFeature} />
                </span>
                <textarea
                  value={featureMessage}
                  onChange={(event) => setFeatureMessage(event.target.value)}
                  className="min-h-[88px] w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring"
                />
              </label>
              <button
                type="button"
                disabled={isSubmitting || !featureMessage.trim()}
                onClick={submitFeature}
                className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <label className="space-y-1 text-xs text-muted-foreground">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0 pt-0.5">What happened?</span>
                  <VoiceDictationButton onAppend={appendBug} />
                </span>
                <textarea
                  value={bugMessage}
                  onChange={(event) => setBugMessage(event.target.value)}
                  className="min-h-[76px] w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring"
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                <span>What page were you on?</span>
                <input
                  value={bugPage}
                  onChange={(event) => setBugPage(event.target.value)}
                  placeholder={pathname || "/"}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring"
                />
              </label>
              <button
                type="button"
                disabled={isSubmitting || !bugMessage.trim()}
                onClick={submitBug}
                className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
