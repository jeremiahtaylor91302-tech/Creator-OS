import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import {
  getPlatformConnectionsByUser,
  getPlatformSetupHint,
} from "@/lib/connections";
import { PLATFORMS } from "@/lib/platforms";
import { formatOAuthError, formatOAuthSuccess } from "@/utils/oauth-message";
import { PlatformConnectionCard } from "@/components/platform-connection-card";
import { BrandBaselineSettings } from "@/components/brand-baseline-settings";
import { TimeBudgetSettings } from "@/components/time-budget-settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SettingsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const rawError = typeof searchParams.error === "string" ? searchParams.error : null;
  const rawSuccess =
    typeof searchParams.success === "string" ? searchParams.success : null;
  const oauthError = formatOAuthError(rawError);
  const oauthSuccess = formatOAuthSuccess(rawSuccess);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { connections, error } = await getPlatformConnectionsByUser(user.id);
  const connectionMap = new Map(connections.map((conn) => [conn.platform, conn]));
  const setupHint = getPlatformSetupHint(error);
  const { data: calendarConnection } = await supabase
    .from("google_calendar_connections")
    .select("status, connected_at, last_error")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-gradient-to-br from-surface to-surface-muted p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Personalize Creator OS and manage platform connections.
        </p>
      </section>

      {setupHint && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {setupHint}
        </section>
      )}
      {oauthError && (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {oauthError}
        </section>
      )}
      {oauthSuccess && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {oauthSuccess}
        </section>
      )}

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Connections</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect or reconnect social accounts here.
        </p>
        <div className="mt-4 space-y-3">
          {PLATFORMS.map((platform) => {
            const connection = connectionMap.get(platform);
            const status = connection?.status ?? "not connected";
            const connected = status === "connected";
            const actionLabel =
              connected && platform === "youtube" ? "Open" : connected ? "Reconnect" : "Connect";
            const actionHref =
              connected && platform === "youtube" ? "/youtube" : `/oauth/${platform}/start`;

            return (
              <PlatformConnectionCard
                key={platform}
                platform={platform}
                status={status}
                handle={connection?.external_username ?? null}
                actionHref={actionHref}
                actionLabel={actionLabel}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect tools that power planning and production tracking.
        </p>
        <div className="mt-4 rounded-xl border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">Google Calendar</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    calendarConnection?.status === "connected"
                      ? "bg-emerald-400"
                      : calendarConnection?.status === "pending"
                        ? "bg-amber-400"
                        : "bg-muted-foreground/60",
                  ].join(" ")}
                />
                <span>{calendarConnection?.status ?? "not connected"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sync filming, editing, and publishing blocks into weekly production tracking.
              </p>
            </div>
            <a
              href="/oauth/google-calendar/start"
              className="rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              {calendarConnection?.status === "connected" ? "Reconnect" : "Connect"}
            </a>
          </div>
        </div>
        {calendarConnection?.last_error && (
          <p className="mt-3 text-xs text-rose-300">{calendarConnection.last_error}</p>
        )}
      </section>

      <section className="rounded-2xl border bg-surface-muted/70 p-5">
        <h2 className="text-lg font-semibold">Theme</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick your default interface style.
        </p>
        <div className="mt-4">
          <ThemeSwitcher />
        </div>
      </section>

      <TimeBudgetSettings />
      <BrandBaselineSettings />
    </div>
  );
}
