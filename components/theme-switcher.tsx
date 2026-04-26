"use client";

import { useEffect, useState } from "react";

type ThemeId = "light" | "dark" | "pink";

const THEMES: Array<{ id: ThemeId; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "pink", label: "Pink" },
];

const STORAGE_KEY = "creatoros-theme";

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "pink") return saved;
    const fromDom = document.documentElement.getAttribute("data-theme");
    if (fromDom === "light" || fromDom === "dark" || fromDom === "pink") return fromDom;
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
    document.cookie = `${STORAGE_KEY}=${activeTheme}; path=/; max-age=31536000; samesite=lax`;
  }, [activeTheme]);

  function setTheme(theme: ThemeId) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    setActiveTheme(theme);
  }

  return (
    <div className="inline-flex rounded-lg border bg-surface p-1">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => setTheme(theme.id)}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-semibold transition",
            activeTheme === theme.id
              ? "bg-accent text-white"
              : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
          ].join(" ")}
          type="button"
        >
          {theme.label}
        </button>
      ))}
    </div>
  );
}
