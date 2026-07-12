"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, useAppNav } from "./use-app-nav";

// Mobile-only bottom tab bar — hidden at desktop widths in favor of Sidebar
// (see that component). Kept as its own component rather than folded into
// Sidebar since the visual shape (bottom bar vs. vertical rail) and the
// Create button's treatment (inline circular button vs. a separate CTA)
// are different enough not to share markup, just the nav logic (useAppNav).
export function NavBar() {
  const { isActive, handleNavClick } = useAppNav();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-background/95 py-2 backdrop-blur lg:hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        if (item.isCreate) {
          return (
            <Link
              key={item.href}
              href={item.href}
              // /lists's page itself inserts a new draft row unconditionally
              // on every load (no guard — see its own comment) — Next.js
              // prefetches a <Link> as soon as it scrolls into view, and
              // this button sits in the bottom nav, visible on nearly every
              // page. Left prefetching on, that silently created a fresh
              // draft on almost every navigation, not just an actual click.
              prefetch={false}
              onClick={(event) => handleNavClick(event, item.href)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground"
              aria-label="Create list"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="size-5" />
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(event) => handleNavClick(event, item.href)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
              isActive(item.href) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
