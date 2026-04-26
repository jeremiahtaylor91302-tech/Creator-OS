"use server";

import { resolveAppBaseUrlFromServerHeaders } from "@/lib/app-base-url";
import { encodedRedirect } from "@/utils/encoded-redirect";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return encodedRedirect("error", "/auth/sign-in", "Email and password required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return encodedRedirect("error", "/auth/sign-in", error.message);
  }

  return redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const appOrigin = await resolveAppBaseUrlFromServerHeaders();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString().trim() ?? "";

  if (!email || !password) {
    return encodedRedirect("error", "/auth/sign-in", "Email and password required.");
  }

  if (!fullName || fullName.length < 2) {
    return encodedRedirect("error", "/auth/sign-in", "Please enter your full name (at least 2 characters).");
  }

  if (fullName.length > 120) {
    return encodedRedirect("error", "/auth/sign-in", "Full name is too long.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appOrigin}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/auth/sign-in", error.message);
  }

  return encodedRedirect(
    "success",
    "/auth/sign-in",
    "Account created. Check your email to confirm your account.",
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
}
