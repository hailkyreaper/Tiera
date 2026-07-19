"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DropdownSelect } from "@/components/dropdown-select";

const RATING_OPTIONS = [
  { value: "", label: "All Ratings" },
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
];

const PUBLISHED_OPTIONS = [
  { value: "", label: "Anytime" },
  { value: "1", label: "This Year" },
  { value: "5", label: "Last 5 Years" },
  { value: "10", label: "Last 10 Years" },
];

// Genre/Rating/Published only — design2/02 also shows a Format filter
// (Paperback/Hardcover/eBook/Audiobook), but books has no format column at
// all, so there's nothing real to filter on; dropped rather than shipping
// a cosmetic no-op (same reasoning as skipping Avg Match/genre pills
// elsewhere in this app).
export function SearchFiltersPanel({ genres }: { genres: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const genre = searchParams.get("genre") ?? "";
  const minRating = searchParams.get("minRating") ?? "";
  const years = searchParams.get("years") ?? "";
  const hasFilters = Boolean(genre || minRating || years);

  const genreOptions = [
    { value: "", label: "All Genres" },
    ...genres.map((g) => ({ value: g, label: g })),
  ];

  // Reads window.location.search at call time rather than closing over the
  // `searchParams` hook value — changing two filters back to back can fire
  // this before the first router.replace's navigation has re-rendered the
  // component with fresh params, and a stale closure would silently drop
  // the first change instead of merging both.
  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function reset() {
    const params = new URLSearchParams(window.location.search);
    params.delete("genre");
    params.delete("minRating");
    params.delete("years");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 rounded-sm bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Filter</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-primary"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          Genre
        </span>
        <DropdownSelect
          value={genre}
          options={genreOptions}
          onChange={(value) => updateParam("genre", value)}
          triggerClassName="w-fit"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          Rating
        </span>
        <DropdownSelect
          value={minRating}
          options={RATING_OPTIONS}
          onChange={(value) => updateParam("minRating", value)}
          triggerClassName="w-fit"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          Published
        </span>
        <DropdownSelect
          value={years}
          options={PUBLISHED_OPTIONS}
          onChange={(value) => updateParam("years", value)}
          triggerClassName="w-fit"
        />
      </div>
    </div>
  );
}
