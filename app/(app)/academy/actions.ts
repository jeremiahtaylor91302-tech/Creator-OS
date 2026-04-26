"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

type WaitlistResult = {
  ok: boolean;
  error?: string;
  alreadyOnList?: boolean;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ownerLeadRecipients() {
  const explicitLeadAddress = process.env.ACADEMY_WAITLIST_LEADS_EMAIL?.trim();
  if (explicitLeadAddress) {
    return [explicitLeadAddress];
  }

  const owners = process.env.OWNER_EMAILS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return owners ?? [];
}

async function sendWaitlistEmails(email: string) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const leadRecipients = ownerLeadRecipients();

  if (!resendApiKey || !fromEmail || leadRecipients.length === 0) {
    return;
  }

  const resend = new Resend(resendApiKey);
  const timestamp = new Date().toLocaleString();

  try {
    await Promise.all([
      resend.emails.send({
        from: fromEmail,
        to: leadRecipients,
        subject: "New Creator Academy waitlist lead",
        text: `New waitlist signup: ${email}\nSigned up at: ${timestamp}`,
      }),
      resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "You are on the Creator Academy waitlist",
        text:
          "Thanks for joining the Creator Academy waitlist. We will send one email when it drops.",
      }),
    ]);
  } catch (error) {
    console.error("Failed to send waitlist emails", error);
  }
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
    await sendWaitlistEmails(email);
    return { ok: true };
  }

  if (error.code === "23505") {
    await sendWaitlistEmails(email);
    return { ok: true, alreadyOnList: true };
  }

  return { ok: false, error: error.message };
}
