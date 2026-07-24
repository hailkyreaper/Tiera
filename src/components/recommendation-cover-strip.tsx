import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import { BookDetailDrawer } from "@/components/tier-list/book-detail-drawer";
import { logRecommendationOpened } from "@/lib/actions/library";
import { TIER_BADGE_COLORS } from "@/lib/tiers";
import type { MatchRecommendation } from "@/lib/db/taste-match";
import type { Tier } from "@/lib/tiers";

// Compare-detail-only alternative to the old MatchRecommendationsRail's
// list-row style — a plain cover grid/strip (cover + their-tier badge +
// title + author), no match% badge or Add button per item. Scoped to this
// one section/page only: every other surface built on
// getMatchRecommendations/RecommendationRow (the standalone Recommendations
// page, Library's TBR rail, Profile/Explore's own rail) keeps the original
// list-row treatment untouched — this is a second, distinct rendering of
// the same real data, not a replacement for it.
//
// `expanded`, when true (after "View more" is clicked), switches from a
// single-row horizontal scroll strip to a wrapping row of the exact same
// fixed-size covers — "View more" extends the list downward into more
// rows, never stretching each cover to fill a grid column (same
// TierMaker-style "fixed size, left-align, leave empty space" convention
// tier rows elsewhere in the app already use, rather than a stretchy
// grid-cols layout).
export function RecommendationCoverStrip({
  recommendations,
  heading,
  moreHref,
  expanded = false,
}: {
  recommendations: MatchRecommendation[];
  heading: string;
  moreHref?: string;
  expanded?: boolean;
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="shrink-0 text-sm font-semibold text-primary-link"
          >
            View more
          </Link>
        )}
      </div>

      <div
        className={
          expanded ? "flex flex-wrap gap-3" : "flex gap-3 overflow-x-auto pb-1"
        }
      >
        {recommendations.map((book) => {
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
                onOpen={logRecommendationOpened.bind(
                  null,
                  book.bookId,
                  "compare_detail",
                )}
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
