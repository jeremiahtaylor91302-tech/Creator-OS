"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/academy", label: "Creator Academy" },
  { href: "/direction", label: "Direction" },
  { href: "/settings", label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="h-full">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 text-xs font-semibold text-accent">
          CO
        </div>
        <div>
          <p className="text-sm font-semibold">Creator OS</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Studio
          </p>
        </div>
      </div>
      <nav className="mt-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-accent text-black shadow-[0_8px_25px_rgba(168,85,247,0.35)]"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
