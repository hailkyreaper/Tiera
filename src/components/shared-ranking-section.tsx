"use client";

import { useState } from "react";
import { SharedRankingRow } from "@/components/shared-ranking-row";
import type { SharedBook } from "@/lib/db/taste-match";

// How many rows show before "View all" — the full list is already in
// memory (getComparisonSummary fetches it all up front), so "View all"
// just lifts a local slice in place rather than navigating/refetching.
const DEFAULT_DISPLAY = 5;

export function SharedRankingSection({ books }: { books: SharedBook[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = books.length > DEFAULT_DISPLAY;
  const toShow = expanded ? books : books.slice(0, DEFAULT_DISPLAY);

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Shared Ranking
        </h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-sm font-medium text-primary-link"
          >
            {expanded ? "View less" : "View all"}
          </button>
        )}
      </div>
      {toShow.length === 0 ? (
        <p className="text-sm text-muted-foreground">No shared books yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {toShow.map((book) => (
            <SharedRankingRow key={book.bookId} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
