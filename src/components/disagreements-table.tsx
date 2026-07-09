import { BookCover } from "@/components/book-cover";
import { scoreToTier, TIER_SCORES } from "@/lib/db/taste-match";
import type { SharedBook } from "@/lib/db/taste-match";

// Unlike MatchedBookRow's tier-spectrum badge, disagreement badges are
// semantic (red = rated low, green = rated high) — the point here is
// "who liked it, who didn't," not which specific tier it landed in.
function sentimentBadgeClass(score: number): string {
  if (score >= TIER_SCORES.A) return "bg-emerald-500/15 text-emerald-600";
  if (score <= TIER_SCORES.C) return "bg-red-500/15 text-red-600";
  return "bg-muted text-muted-foreground";
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${sentimentBadgeClass(score)}`}
    >
      {scoreToTier(score)}
    </span>
  );
}

export function DisagreementsTable({
  books,
  theirUsername,
}: {
  books: SharedBook[];
  theirUsername: string;
}) {
  if (books.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No real disagreements yet — your ratings mostly line up.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Book</span>
        <div className="flex gap-4">
          <span className="w-16 text-center">You rated</span>
          <span className="w-16 text-center">{theirUsername} rated</span>
        </div>
      </div>
      {books.map((book) => (
        <div key={book.bookId} className="flex items-center gap-3">
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
          <div className="flex gap-4">
            <div className="flex w-16 justify-center">
              <ScoreBadge score={book.scoreA} />
            </div>
            <div className="flex w-16 justify-center">
              <ScoreBadge score={book.scoreB} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
