import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { Avatar } from "@/components/avatar";
import { MatchBadge } from "@/components/match-badge";
import type { TopMatchPerson } from "@/lib/db/top-matches";

// Horizontal row (design2/03) — avatar/name/match%/genre-line on the left,
// Top Favorites covers on the right, chevron at the far edge. Replaces the
// earlier vertical card (avatar/name up top, favorites row stacked below)
// now that this renders full-width as a single list rather than a 2-column
// card grid.
export function TopMatchCard({ person }: { person: TopMatchPerson }) {
  return (
    <Link
      href={`/compare/${person.username}`}
      className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/50"
    >
      <Avatar
        src={person.avatarUrl}
        name={person.username}
        imageSize={48}
        sizeClassName="size-12"
        textClassName="text-base"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {person.displayName ? (
            <span className="truncate font-semibold text-foreground">
              {person.displayName}
            </span>
          ) : (
            <span className="truncate font-semibold text-foreground">
              @{person.username}
            </span>
          )}
          <MatchBadge percentage={person.matchPercentage} />
        </div>
        {person.displayName && (
          <span className="truncate text-sm text-muted-foreground">
            @{person.username}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {person.booksRankedCount} books ranked · {person.sharedBookCount}{" "}
          shared
        </span>
        {person.topGenres.length > 0 && (
          <span className="truncate text-xs text-muted-foreground">
            {person.topGenres.join(" • ")}
          </span>
        )}
      </div>

      {person.topFavorites.length > 0 && (
        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            Top Favorites
          </span>
          <div className="flex gap-1.5">
            {person.topFavorites.map((book) => (
              <div key={book.bookId} className="w-12 shrink-0">
                <BookCover src={book.thumbnail} alt={book.title} size={48} />
              </div>
            ))}
          </div>
        </div>
      )}

      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
