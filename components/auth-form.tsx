"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";

export function AuthForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <form className="mt-6 space-y-4">
      {mode === "sign-up" ? (
        <div className="space-y-2">
          <label htmlFor="full_name" className="text-sm text-muted-foreground">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-accent/40 focus:ring"
            placeholder="Alex Rivera"
          />
          <p className="text-xs text-muted-foreground">
            Required when you create an account. Used in your dashboard.
          </p>
        </div>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-muted-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-accent/40 focus:ring"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm text-muted-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none ring-accent/40 focus:ring"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-muted-foreground transition hover:text-foreground"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "sign-in"
              ? "bg-accent text-white hover:bg-accent-strong"
              : "border hover:bg-white/5"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "sign-up"
              ? "bg-accent text-white hover:bg-accent-strong"
              : "border hover:bg-white/5"
          }`}
        >
          Create account
        </button>
      </div>
      <button
        formAction={mode === "sign-up" ? signUp : signIn}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
      >
        {mode === "sign-up" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a17.73 17.73 0 0 1-4.11 5.3" />
      <path d="M6.61 6.61A17.6 17.6 0 0 0 1 12s4 8 11 8a10.9 10.9 0 0 0 5.39-1.39" />
    </svg>
  );
}
