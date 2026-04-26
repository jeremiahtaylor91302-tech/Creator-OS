"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type LandingHeaderProps = {
  publicSuffix: string;
  isLoggedIn: boolean;
  isVisitorView: boolean;
};

export function LandingHeader({
  publicSuffix,
  isLoggedIn,
  isVisitorView,
}: LandingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, close]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const primaryHref = isLoggedIn ? "/dashboard" : `/auth/sign-in${isVisitorView ? "?next=/" : ""}`;
  const primaryLabel = isLoggedIn ? "Go to dashboard" : "Get started free";

  const mobileMenu =
    menuOpen && mounted ? (
      <div
        id="landing-nav-menu"
        className="fixed inset-0 z-[200] flex flex-col bg-background md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="truncate text-lg font-semibold tracking-tight text-foreground">Creator OS</p>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition active:scale-95"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto px-2 pt-2"
          aria-label="Main navigation"
        >
          <div className="mx-auto max-w-md divide-y divide-border/70">
            <MobileRow href={`/blog${publicSuffix}`} onNavigate={close}>
              Blog
            </MobileRow>
            <MobileRow href={`/careers${publicSuffix}`} onNavigate={close}>
              Careers
            </MobileRow>
            {!isLoggedIn && (
              <MobileRow
                href={`/auth/sign-in${isVisitorView ? "?next=/" : ""}`}
                onNavigate={close}
              >
                Sign in
              </MobileRow>
            )}
            {isLoggedIn && isVisitorView && (
              <MobileRow href="/dashboard" onNavigate={close}>
                Go to dashboard
              </MobileRow>
            )}
            {isLoggedIn && (
              <MobileRow
                href={isVisitorView ? "/" : "/?visitor=1"}
                onNavigate={close}
              >
                {isVisitorView ? "Exit visitor view" : "View as visitor"}
              </MobileRow>
            )}
          </div>
        </nav>

        <div
          className="shrink-0 border-t border-border bg-background px-4 pt-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <Link
            href={primaryHref}
            onClick={close}
            className="mx-auto flex h-12 w-full max-w-md items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-strong text-base font-semibold text-white shadow-lg transition active:opacity-90"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    ) : null;

  return (
    <header className="rounded-xl border border-border/80 bg-surface/90 px-3 py-2.5 backdrop-blur-md sm:rounded-2xl sm:px-4 sm:py-3 md:rounded-2xl md:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="hidden text-xs leading-tight text-muted-foreground md:block md:text-sm">
            Creator dashboard
          </p>
          <h1 className="text-lg font-semibold leading-tight tracking-tight md:text-2xl">Creator OS</h1>
        </div>

        <nav
          className="hidden min-w-0 shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm md:flex md:gap-x-5"
          aria-label="Main"
        >
          <Link
            href={`/blog${publicSuffix}`}
            className="whitespace-nowrap font-medium text-muted-foreground transition hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            href={`/careers${publicSuffix}`}
            className="whitespace-nowrap font-medium text-muted-foreground transition hover:text-foreground"
          >
            Careers
          </Link>
          {!isLoggedIn && (
            <Link
              href={`/auth/sign-in${isVisitorView ? "?next=/" : ""}`}
              className="whitespace-nowrap font-medium text-muted-foreground transition hover:text-foreground"
            >
              Sign in
            </Link>
          )}
          {isLoggedIn && isVisitorView && (
            <Link
              href="/dashboard"
              className="whitespace-nowrap font-medium text-muted-foreground transition hover:text-foreground"
            >
              Go to dashboard
            </Link>
          )}
          {isLoggedIn && (
            <Link
              href={isVisitorView ? "/" : "/?visitor=1"}
              className="whitespace-nowrap font-medium text-muted-foreground transition hover:text-foreground"
            >
              {isVisitorView ? "Exit visitor view" : "View as visitor"}
            </Link>
          )}
          <Link
            href={primaryHref}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {primaryLabel}
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted/80 text-foreground transition active:scale-95 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="landing-nav-menu"
          tabIndex={menuOpen ? -1 : 0}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {mounted && mobileMenu ? createPortal(mobileMenu, document.body) : null}
    </header>
  );
}

function MobileRow({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex min-h-[52px] items-center rounded-xl px-4 text-[17px] font-medium text-foreground transition active:bg-surface-muted"
    >
      {children}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
