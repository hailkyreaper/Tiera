"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, SIDEBAR_ITEMS, useAppNav } from "./use-app-nav";

// Lists/Profile/Settings all currently resolve to the exact same URL (bare
// /profile — Settings has no real page yet, Lists is just Profile's default
// tab), so URL matching alone can't tell them apart and all three would
// light up together. Track whichever was actually clicked last (within this
// client session) to break the tie; before any click, or after navigating
// away some other way (back button, a direct link elsewhere), fall back to
// "Lists" since that IS the page's real default view.
const AMBIGUOUS_PROFILE_LABELS = ["Lists", "Profile", "Settings"];

export function SidebarNav() {
  const { isActive, isProfileTabActive, handleNavClick } = useAppNav();
  const [clickedLabel, setClickedLabel] = useState<string | null>(null);
  const createItem = NAV_ITEMS.find((item) => item.isCreate)!;
  const CreateIcon = createItem.icon;

  const effectiveAmbiguousLabel =
    clickedLabel && AMBIGUOUS_PROFILE_LABELS.includes(clickedLabel)
      ? clickedLabel
      : "Lists";

  return (
    <div className="flex flex-col gap-1">
      <nav className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const urlActive =
            "tab" in item ? isProfileTabActive(item.tab) : isActive(item.href);
          const active =
            urlActive &&
            (!AMBIGUOUS_PROFILE_LABELS.includes(item.label) ||
              effectiveAmbiguousLabel === item.label);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(event) => {
                setClickedLabel(item.label);
                handleNavClick(event, item.href);
              }}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-base font-medium",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-6" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href={createItem.href}
        // Same prefetch concern as NavBar's Create button — /lists creates a
        // new draft unconditionally on every load.
        prefetch={false}
        onClick={(event) => handleNavClick(event, createItem.href)}
        className="mt-3 flex items-center justify-center gap-2 rounded-sm bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <CreateIcon className="size-5" />
        Create List
      </Link>
    </div>
  );
}
