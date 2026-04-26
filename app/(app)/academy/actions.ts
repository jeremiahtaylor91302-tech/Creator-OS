"use server";

import { createClient } from "@/lib/supabase/server";

type WaitlistResult = {
  ok: boolean;
  error?: string;
  alreadyOnList?: boolean;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function joinAcademyWaitlist(emailInput: string): Promise<WaitlistResult> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in first." };
  }

  const { error } = await supabase
    .from("academy_waitlist")
    .insert({ email, signed_up_at: new Date().toISOString() });

  if (!error) {
    return { ok: true };
  }

  if (error.code === "23505") {
    return { ok: true, alreadyOnList: true };
  }

  return { ok: false, error: error.message };
}
