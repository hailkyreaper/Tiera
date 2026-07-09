import { BookCover } from "@/components/book-cover";
import { TIER_BADGE_COLORS } from "@/lib/tiers";
import { scoreToTier } from "@/lib/db/taste-match";
import type { SharedBook } from "@/lib/db/taste-match";
import type { Tier } from "@/lib/tiers";

// A single row in "Top Books You Both Love": cover, title/author, and a tier
// badge (the higher of the two shared scores, since both already cleared
// the "both love it" bar).
export function MatchedBookRow({ book }: { book: SharedBook }) {
  const tier = scoreToTier(Math.max(book.scoreA, book.scoreB)) as Tier;
  const badgeColor =
    tier === "unranked" ? "bg-muted" : TIER_BADGE_COLORS[tier];

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 shrink-0">
        <BookCover src={book.thumbnail} alt={book.title} size={40} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {book.title}
        </span>
        {book.authors && book.authors.length > 0 && (
          <span className="truncate text-xs text-muted-foreground">
            {book.authors[0]}
          </span>
        )}
      </div>
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${badgeColor}`}
      >
        {tier}
      </span>
    </div>
  );
}
