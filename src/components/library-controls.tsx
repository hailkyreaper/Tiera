"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { Filter, ArrowUpDown, Check } from "lucide-react";
import type { LibrarySort } from "@/lib/db/library";

const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "title", label: "Title (A–Z)" },
  { value: "author", label: "Author (A–Z)" },
  { value: "rating", label: "Highest Rated" },
];

const triggerClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted";
const popupClass =
  "max-h-64 min-w-40 overflow-y-auto rounded-xl bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10";
const itemClass =
  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 data-[highlighted]:bg-muted";

export function LibraryControls({
  genres,
  currentSort,
  currentGenre,
}: {
  genres: string[];
  currentSort: LibrarySort;
  currentGenre: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(key: "sort" | "genre", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "library");
    if (value === "all" || value === "recent") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/profile?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Menu.Root>
        <Menu.Trigger className={triggerClass}>
          <Filter className="size-3.5" />
          Filter
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="end">
            <Menu.Popup className={popupClass}>
              <Menu.Item
                onClick={() => navigate("genre", "all")}
                className={itemClass}
              >
                All Genres
                {currentGenre === "all" && <Check className="size-3.5" />}
              </Menu.Item>
              {genres.map((genre) => (
                <Menu.Item
                  key={genre}
                  onClick={() => navigate("genre", genre)}
                  className={itemClass}
                >
                  {genre}
                  {currentGenre === genre && <Check className="size-3.5" />}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

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
                  onClick={() => navigate("sort", option.value)}
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
    </div>
  );
}
