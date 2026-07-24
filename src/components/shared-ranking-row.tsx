import { BookCover } from "@/components/book-cover";
import { BookDetailDrawer } from "@/components/tier-list/book-detail-drawer";
import { TIER_BADGE_COLORS } from "@/lib/tiers";
import { scoreToTier } from "@/lib/db/taste-match";
import type { SharedBook } from "@/lib/db/taste-match";
import type { Tier } from "@/lib/tiers";

function TierPill({ score, who }: { score: number; who: string }) {
  const tier = scoreToTier(score) as Tier;
  const color = tier === "unranked" ? "bg-muted" : TIER_BADGE_COLORS[tier];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-bold tracking-wide text-muted-foreground uppercase">
        {who}
      </span>
      <span
        className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${color}`}
      >
        {tier}
      </span>
    </div>
  );
}

// A single row in the "Shared Ranking" list — every book both people have
// ranked, with both tier badges shown side by side. Replaces the old split
// of Top Books You Both Love / Shared Dislikes / Biggest Differences into
// three separate sections: one unified list, sorted best-agreement-first,
// where a real disagreement is already visible as two very different
// badges rather than needing its own dedicated panel.
export function SharedRankingRow({ book }: { book: SharedBook }) {
  return (
    <div className="flex items-center gap-3">
      <BookDetailDrawer
        book={{
          id: book.bookId,
          title: book.title,
          thumbnail: book.thumbnail,
          description: book.description,
          authors: book.authors,
          averageRating: book.averageRating,
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
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
        </div>
      </BookDetailDrawer>
      <div className="flex shrink-0 items-center gap-2">
        <TierPill score={book.scoreA} who="You" />
        <TierPill score={book.scoreB} who="Them" />
      </div>
    </div>
  );
}
