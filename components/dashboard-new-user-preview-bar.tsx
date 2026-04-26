"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

export function DashboardNewUserPreviewBar({ defaultActive }: { defaultActive: boolean }) {
  const router = useRouter();
  const id = useId();
  const [active, setActive] = useState(defaultActive);

  useEffect(() => {
    setActive(defaultActive);
  }, [defaultActive]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 sm:items-center">
        <input
          id={`${id}-preview`}
          type="checkbox"
          checked={active}
          onChange={(event) => {
            const next = event.target.checked;
            setActive(next);
            if (next) {
              router.replace("/dashboard?newUserPreview=1");
            } else {
              router.replace("/dashboard");
            }
          }}
          className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-accent sm:mt-0"
        />
        <label htmlFor={`${id}-preview`} className="cursor-pointer text-sm leading-snug">
          <span className="font-semibold text-foreground">Preview as new user</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            See the dashboard with no platform connections, onboarding visible, and no “action required”
            banner. Your real data stays safe — this is display-only.
          </span>
        </label>
      </div>
    </div>
  );
}
