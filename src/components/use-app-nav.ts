"use client";

import type * as React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Home, Search, Plus, Users, CircleUserRound } from "lucide-react";
import { discardUnsavedDraft } from "@/app/(app)/lists/actions";

export const NAV_ITEMS = [
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

// Shared by NavBar (mobile bottom bar) and Sidebar (desktop) — both need
// identical active-tab logic and the same "abandon a draft on nav-away"
// behavior (see discardUnsavedDraft), so it lives in one place rather than
// being copy-pasted into two components that could drift apart.
export function useAppNav() {
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

  function isActive(href: string) {
    return isListDetail ? activeHref === href : pathname.startsWith(href);
  }

  function handleNavClick(event: React.MouseEvent, href: string) {
    if (!editingDraftId) return;
    event.preventDefault();
    discardUnsavedDraft(editingDraftId).then(() => router.push(href));
  }

  return { isActive, handleNavClick };
}
