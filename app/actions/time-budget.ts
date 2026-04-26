"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateTimeBudgetResult = { ok: true } | { ok: false; error: string };

export async function updateWeeklyTimeBudget(hours: number): Promise<UpdateTimeBudgetResult> {
  if (!Number.isFinite(hours) || hours < 0.5) {
    return { ok: false, error: "Budget must be at least 0.5 hours." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ weekly_time_budget_hours: hours, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
