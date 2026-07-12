"use client";

import type * as React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Home,
  Search,
  Plus,
  Users,
  CircleUserRound,
  BookOpen,
  List,
  Settings as SettingsIcon,
} from "lucide-react";
import { discardUnsavedDraft } from "@/app/(app)/lists/actions";

// Mobile bottom bar — unchanged, 5 items.
export const NAV_ITEMS = [
  { href: "/explore", label: "Explore", icon: Home, isCreate: false },
  { href: "/search", label: "Search", icon: Search, isCreate: false },
  { href: "/lists", label: "Create", icon: Plus, isCreate: true },
  { href: "/compare", label: "Compare", icon: Users, isCreate: false },
  { href: "/profile", label: "Profile", icon: CircleUserRound, isCreate: false },
] as const;

// Desktop sidebar only — a fuller set than the mobile bar. Library/Lists
// reuse Profile's existing tabs (same hrefs/icons as ProfileTabs) rather than
// new pages. Settings also points at /profile for now — there's no
// dedicated settings page yet (Edit Profile/Log out just live inline there),
// user's call to reuse it rather than build a new page. Lists/Profile/
// Settings all share that one URL, so SidebarNav tracks which was actually
// clicked to keep exactly one highlighted at a time (see its own comment).
export const SIDEBAR_ITEMS = [
  { href: "/explore", label: "Explore", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/compare", label: "Compare", icon: Users },
  { href: "/profile?tab=library", label: "Library", icon: BookOpen, tab: "library" },
  { href: "/profile", label: "Lists", icon: List, tab: "lists" },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
  { href: "/profile", label: "Settings", icon: SettingsIcon },
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

  // Library/Lists both live at /profile, distinguished only by ?tab= — a
  // plain isActive(href) can't tell them apart, since Next's usePathname()
  // never includes the query string. Mirrors ProfileTabs' own default-tab
  // logic (no/unrecognized tab param falls back to "lists").
  function isProfileTabActive(tab: "lists" | "library") {
    if (pathname !== "/profile") return false;
    const currentTab = searchParams.get("tab") === "library" ? "library" : "lists";
    return currentTab === tab;
  }

  function handleNavClick(event: React.MouseEvent, href: string) {
    if (!editingDraftId) return;
    event.preventDefault();
    discardUnsavedDraft(editingDraftId).then(() => router.push(href));
  }

  return { isActive, isProfileTabActive, handleNavClick };
}
