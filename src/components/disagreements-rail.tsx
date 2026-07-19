import { BookCover } from "@/components/book-cover";
import { BookDetailDrawer } from "@/components/tier-list/book-detail-drawer";
import { scoreToTier, TIER_SCORES } from "@/lib/db/taste-match";
import type { SharedBook } from "@/lib/db/taste-match";

// Same semantic (not tier-spectrum) coloring reasoning as DisagreementsTable
// — the point is "who liked it, who didn't."
function sentimentClass(score: number): string {
  if (score >= TIER_SCORES.A) return "bg-emerald-500/15 text-emerald-600";
  if (score <= TIER_SCORES.C) return "bg-red-500/15 text-red-600";
  return "bg-muted text-muted-foreground";
}

// Compact rail version of DisagreementsTable (design2/04's right rail) —
// reuses the same disagreeOn data/logic from getComparisonSummary, just a
// narrower stacked layout ("You rated X" / "They rated Y" on their own
// lines) instead of a two-column table, to fit a w-96 rail.
export function DisagreementsRail({ books }: { books: SharedBook[] }) {
  if (books.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-sm bg-card p-6">
      <h2 className="text-base font-semibold text-foreground">
        Biggest Differences
      </h2>

      <div className="flex flex-col divide-y divide-border">
        {books.map((book) => (
          <BookDetailDrawer
            key={book.bookId}
            book={{
              id: book.bookId,
              title: book.title,
              thumbnail: book.thumbnail,
              description: book.description,
              authors: book.authors,
              averageRating: book.averageRating,
            }}
          >
            <div className="flex gap-3 py-3 text-left first:pt-0 last:pb-0">
              <div className="w-12 shrink-0">
                <BookCover src={book.thumbnail} alt={book.title} size={48} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {book.title}
                </p>
                {book.authors && book.authors.length > 0 && (
                  <p className="truncate text-xs text-muted-foreground">
                    by {book.authors[0]}
                  </p>
                )}
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    You rated
                    <span
                      className={`flex size-5 items-center justify-center rounded-xs text-[0.65rem] font-bold ${sentimentClass(book.scoreA)}`}
                    >
                      {scoreToTier(book.scoreA)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    They rated
                    <span
                      className={`flex size-5 items-center justify-center rounded-xs text-[0.65rem] font-bold ${sentimentClass(book.scoreB)}`}
                    >
                      {scoreToTier(book.scoreB)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </BookDetailDrawer>
        ))}
      </div>
    </div>
  );
}
