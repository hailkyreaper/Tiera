import Image from "next/image";
import { Bell } from "lucide-react";
import { BookSearchForm } from "@/components/book-search-form";
import { addBookToLibrary } from "@/app/(app)/search/actions";

// Desktop-only (hidden below `lg`, matching Sidebar) — logo lives here now
// instead of Sidebar (avoids showing it twice). The logo segment is a fixed
// w-80 to line up exactly with Sidebar's own width below it; the search
// segment's px-6 matches the content column's own lg:p-6 so the search bar
// starts at the same x-position as each page's heading (e.g. "Explore").
// Notifications is a placeholder icon only — there's no real notifications
// feature/data yet, this is just the chrome slot for one.
export function TopBar() {
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

      <div className="flex flex-1 items-center justify-between gap-4 px-6">
        <div className="w-full max-w-md">
          <BookSearchForm
            basePath="/search"
            action={addBookToLibrary}
            extraParams={{ type: "books" }}
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-5" />
        </button>
      </div>
    </div>
  );
}
