"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookSearchForm } from "@/components/book-search-form";
import { addBookToLibrary } from "@/app/(app)/search/actions";
import { cn } from "@/lib/utils";

// Desktop-only (hidden below `lg`, matching Sidebar) — logo lives here now
// instead of Sidebar (avoids showing it twice). The logo segment is a fixed
// w-80 to line up exactly with Sidebar's own width below it; the search
// segment's px-6 matches the content column's own lg:p-6 so the search bar
// starts at the same x-position as each page's heading (e.g. "Explore").
// Routes (and their sub-pages) that don't need the top search box — Search
// itself already covers book search, so it's redundant on Explore, and not
// relevant at all on Compare/Profile (user's call, one section at a time).
// /lists is excluded too: every /lists/[id] sub-page (search, library, the
// edit form) already has its own purpose-built "add to this list" search UI
// lower on the page. Leaving this global box visible there let its "Add"
// button (bound to addBookToLibrary, no tierListId) sit right above the
// page's own Add button (bound to addToUnrankedAndStay) — both render an
// identical-looking dropdown, so clicking the wrong one silently added the
// book to the library instead of the list. Confirmed live: this, not a DB
// write failure, is what a QA pass reported as "Add shows success but
// doesn't save" — the write always succeeded, just to the wrong table.
const NO_SEARCH_PREFIXES = ["/explore", "/compare", "/profile", "/lists"];

export function TopBar({ notificationsSlot }: { notificationsSlot: ReactNode }) {
  const pathname = usePathname();
  const showSearch = !NO_SEARCH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return (
    <div className="sticky top-0 z-20 hidden h-20 shrink-0 border-b border-border bg-background/95 backdrop-blur lg:flex">
      <div className="flex w-80 shrink-0 items-center gap-2.5 px-6">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={32}
          height={32}
          className="rounded-sm"
        />
        <span className="text-xl font-semibold text-foreground">Tiera</span>
      </div>

      <div
        className={cn(
          "flex flex-1 items-center gap-4 px-6",
          showSearch ? "justify-between" : "justify-end",
        )}
      >
        {showSearch && (
          <div className="w-full max-w-md">
            <BookSearchForm
              basePath="/search"
              action={addBookToLibrary}
              extraParams={{ type: "books" }}
              autoFocus={false}
            />
          </div>
        )}

        {notificationsSlot}
      </div>
    </div>
  );
}
