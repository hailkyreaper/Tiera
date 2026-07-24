"use client";

import { useState } from "react";
import { BookCover } from "@/components/book-cover";
import { BookDetailDrawer } from "@/components/tier-list/book-detail-drawer";
import {
  addRecommendationToLibrary,
  logRecommendationOpened,
} from "@/lib/actions/library";
import { TIER_BADGE_COLORS } from "@/lib/tiers";
import { cn } from "@/lib/utils";
import type { MatchRecommendation } from "@/lib/db/taste-match";
import type { RecommendationSource } from "@/lib/db/recommendation-outcomes";
import type { Tier } from "@/lib/tiers";

// How many covers show before "View more" — the full list (already fetched
// in one go by the caller) is already in memory, so "View more" just lifts
// a local slice rather than navigating/refetching anything.
const DEFAULT_DISPLAY = 4;

// Compare-detail-only alternative to the old MatchRecommendationsRail's
// list-row style — a plain cover grid/strip (cover + their-tier badge +
// title + author), no match% badge per item. Scoped to this one section/
// page only: every other surface built on getMatchRecommendations/
// RecommendationRow (the standalone Recommendations page, Library's TBR
// rail, Profile/Explore's own rail) keeps the original list-row treatment
// untouched — this is a second, distinct rendering of the same real data,
// not a replacement for it.
//
// "View more" expands in place (client-side state, no navigation/refetch)
// and reveals every remaining item at once — switching from a single-row
// horizontal scroll strip to a wrapping row of the exact same fixed-size
// covers (same TierMaker-style "fixed size, left-align, leave empty space"
// convention tier rows elsewhere in the app already use, rather than a
// stretchy grid-cols layout).
export function RecommendationCoverStrip({
  recommendations,
  heading,
  path,
  source,
  bleed = false,
}: {
  recommendations: MatchRecommendation[];
  heading: string;
  // Wired straight into each cover's drawer as its "Add to My List" action —
  // this strip never had its own Add button before (unlike RecommendationRow),
  // so the drawer is the only place to add one of these from.
  path: string;
  source: RecommendationSource;
  // Lets the (collapsed, still-scrolling) cover row bleed past the page's
  // own left/right padding to the true viewport edge — same convention
  // FavoritesRow's original scroll-strip treatment used. Only meaningful
  // for the mobile/tablet inline instance of this component (compare
  // detail's `xl:hidden` render); the desktop right-rail `<aside>` already
  // sits inside its own bg-card panel, where bleeding wouldn't make sense,
  // so that instance leaves this off.
  bleed?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (recommendations.length === 0) return null;

  const hasMore = recommendations.length > DEFAULT_DISPLAY;
  const toShow = expanded
    ? recommendations
    : recommendations.slice(0, DEFAULT_DISPLAY);

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="shrink-0 text-sm font-semibold text-primary-link"
          >
            {expanded ? "View less" : "View more"}
          </button>
        )}
      </div>

      <div
        className={
          expanded
            ? "flex flex-wrap gap-3"
            : cn(
                "flex gap-3 overflow-x-auto pb-1",
                bleed && "-mx-4 pl-4 lg:-mx-6 lg:pl-6",
              )
        }
      >
        {toShow.map((book) => {
          const tier = book.theirTier as Tier;
          const badgeColor =
            tier in TIER_BADGE_COLORS
              ? TIER_BADGE_COLORS[tier as Exclude<Tier, "unranked">]
              : "bg-muted";

          return (
            // The fixed-width box has to be the actual flex item (outside
            // BookDetailDrawer), not a child of it — BookDetailDrawer's own
            // trigger is `w-full`, which is harmless in a non-wrapping
            // scroll strip (it just gets shrunk to fit) but claims an
            // entire row for itself the moment flex-wrap is enabled,
            // confirmed live: covers rendered one-per-row instead of
            // several per row until this moved outside.
            <div key={book.bookId} className="w-20 shrink-0 text-left">
              <BookDetailDrawer
                book={{
                  id: book.bookId,
                  title: book.title,
                  thumbnail: book.thumbnail,
                  description: book.description,
                  authors: book.authors,
                  averageRating: book.averageRating,
                }}
                onOpen={logRecommendationOpened.bind(null, book.bookId, source)}
                addAction={addRecommendationToLibrary}
                addFields={{ bookId: book.bookId, path, source }}
              >
                <div className="relative w-20">
                  <BookCover src={book.thumbnail} alt={book.title} size={80} />
                  <span
                    className={`absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${badgeColor}`}
                  >
                    {book.theirTier}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-xs font-medium text-foreground">
                  {book.title}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {book.authors?.[0] ?? "Unknown author"}
                </p>
              </BookDetailDrawer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
