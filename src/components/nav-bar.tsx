"use client";

import type * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Home, Search, Plus, Users, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { discardUnsavedDraft } from "@/app/(app)/lists/actions";

const NAV_ITEMS = [
  { href: "/explore", label: "Explore", icon: Home, isCreate: false },
  { href: "/search", label: "Search", icon: Search, isCreate: false },
  { href: "/lists", label: "Create", icon: Plus, isCreate: true },
  { href: "/compare", label: "Compare", icon: Users, isCreate: false },
  { href: "/profile", label: "Profile", icon: CircleUserRound, isCreate: false },
] as const;

// List detail pages are reachable from several different tabs (Explore,
// Profile, ...). Keep the nav highlighted on wherever the user actually came
// from — Reddit-post-style — instead of force-switching to Create just
// because that's where the /lists URL happens to live.
const FROM_TO_HREF: Record<string, string> = {
  explore: "/explore",
  profile: "/profile",
};

export function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isListDetail = pathname !== "/lists" && /^\/lists\/[^/]+/.test(pathname);
  const activeHref = isListDetail
    ? FROM_TO_HREF[searchParams.get("from") ?? ""]
    : undefined;

  // `?edit=true` only ever runs against a still-unsaved draft — tapping any
  // other tab from here counts as abandoning it, same as Cancel (see
  // discardUnsavedDraft). Await the delete before navigating so the tab
  // being landed on never renders the about-to-be-discarded draft.
  const editingDraftId =
    isListDetail && searchParams.get("edit") === "true"
      ? pathname.match(/^\/lists\/([^/]+)/)?.[1]
      : undefined;

  function handleNavClick(event: React.MouseEvent, href: string) {
    if (!editingDraftId) return;
    event.preventDefault();
    discardUnsavedDraft(editingDraftId).then(() => router.push(href));
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-background/95 py-2 backdrop-blur">
      {NAV_ITEMS.map((item) => {
        const isActive = isListDetail
          ? activeHref === item.href
          : pathname.startsWith(item.href);
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
              isActive ? "text-primary" : "text-muted-foreground",
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
