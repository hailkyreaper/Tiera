"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, SIDEBAR_ITEMS, useAppNav } from "./use-app-nav";

export function SidebarNav() {
  const { isActive, handleNavClick } = useAppNav();
  const createItem = NAV_ITEMS.find((item) => item.isCreate)!;
  const CreateIcon = createItem.icon;

  return (
    <div className="flex flex-col gap-1">
      <nav className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(event) => handleNavClick(event, item.href)}
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
