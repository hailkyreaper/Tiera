import type { ReactNode } from "react";
import Image from "next/image";

// Desktop-only (hidden below `lg`, matching Sidebar) — logo lives here now
// instead of Sidebar (avoids showing it twice). The logo segment is a fixed
// w-80 to line up exactly with Sidebar's own width below it.
//
// The search box that used to live here was removed entirely — Search
// already covers book search as its own dedicated destination, and the
// global box's presence on /lists pages previously caused a real bug (its
// Add button, bound to addBookToLibrary with no tierListId, sat right above
// a list page's own "add to this list" search UI — both rendered identical-
// looking dropdowns, so clicking the wrong one silently added a book to the
// library instead of the list; see git history for the fix). Removing the
// box outright instead of keeping the growing per-route exclusion list.
export function TopBar({ notificationsSlot }: { notificationsSlot: ReactNode }) {
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

      <div className="flex flex-1 items-center justify-end gap-4 px-6">
        {notificationsSlot}
      </div>
    </div>
  );
}
