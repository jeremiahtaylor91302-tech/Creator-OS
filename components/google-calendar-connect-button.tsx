"use client";

/**
 * Full document navigation — required so the server 302 to accounts.google.com
 * is not swallowed by the App Router client transition.
 */
export function GoogleCalendarConnectButton({ connected }: { connected: boolean }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.assign("/oauth/google-calendar/start");
      }}
      className="rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:opacity-90"
    >
      {connected ? "Reconnect" : "Connect"}
    </button>
  );
}
