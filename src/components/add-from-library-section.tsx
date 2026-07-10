"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { ArrowUpDown, Check } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { removeBooksFromLibrary } from "@/app/(app)/profile/actions";
import { addBooksToUnranked } from "@/app/(app)/lists/[id]/library/actions";
import { cn } from "@/lib/utils";
import type { LibraryBook, LibrarySort } from "@/lib/db/library";

const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "title", label: "Title (A–Z)" },
  { value: "author", label: "Author (A–Z)" },
  { value: "rating", label: "Highest Rated" },
];

const triggerClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted";
const popupClass =
  "max-h-64 min-w-40 overflow-y-auto rounded-xl bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10";
const itemClass =
  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 data-[highlighted]:bg-muted";

export function AddFromLibrarySection({
  books,
  tierListId,
  currentSort,
}: {
  books: LibraryBook[];
  tierListId: string;
  currentSort: LibrarySort;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function navigateSort(value: LibrarySort) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/lists/${tierListId}/library?${params.toString()}`);
  }

  function toggleSelected(bookId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleAddToUnranked() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      await addBooksToUnranked(tierListId, ids);
      exitSelectMode();
    });
  }

  function handleDeleteFromLibrary() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const plural = ids.length > 1 ? "these books" : "this book";
    if (
      !window.confirm(
        `Remove ${plural} from your library? This removes ${ids.length > 1 ? "them" : "it"} from your library entirely, not just from this list.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await removeBooksFromLibrary(ids);
      exitSelectMode();
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase">
          Your Library
        </h2>

        {selectMode ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={exitSelectMode}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selectedIds.size === 0 || isPending}
              onClick={handleDeleteFromLibrary}
            >
              Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.size === 0 || isPending}
              onClick={handleAddToUnranked}
            >
              Add{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Menu.Root>
              <Menu.Trigger className={triggerClass}>
                <ArrowUpDown className="size-3.5" />
                Sort
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={6} align="end">
                  <Menu.Popup className={popupClass}>
                    {SORT_OPTIONS.map((option) => (
                      <Menu.Item
                        key={option.value}
                        onClick={() => navigateSort(option.value)}
                        className={itemClass}
                      >
                        {option.label}
                        {currentSort === option.value && (
                          <Check className="size-3.5" />
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>

            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className={triggerClass}
            >
              Select
            </button>
          </div>
        )}
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Everything in your library is already in this list.
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {books.map((book) => {
            const isSelected = selectedIds.has(book.bookId);

            return (
              <div
                key={book.bookId}
                role={selectMode ? "button" : undefined}
                tabIndex={selectMode ? 0 : undefined}
                onClick={() => selectMode && toggleSelected(book.bookId)}
                className={cn("relative", selectMode && "cursor-pointer")}
              >
                <div className={cn(isSelected && "opacity-60")}>
                  <BookCover
                    src={book.thumbnail}
                    alt={book.title}
                    size={100}
                  />
                </div>
                {selectMode && (
                  <span
                    className={cn(
                      "absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full border-2",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/80 bg-black/30",
                    )}
                  >
                    {isSelected && <Check className="size-3.5" />}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
