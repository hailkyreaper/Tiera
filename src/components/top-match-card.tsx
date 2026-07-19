import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { Avatar } from "@/components/avatar";
import { MatchBadge } from "@/components/match-badge";
import type { TopMatchPerson } from "@/lib/db/top-matches";

// Mobile (comupdate.png's Top Matches screen): Top Favorites is its own
// full-width row below the name/match line, not squeezed to the side —
// giving the card more breathing room instead of everything clumped into
// one tight horizontal row. Desktop (design2/03) keeps the original
// horizontal layout (favorites to the right, in the same row as the
// avatar), since there's enough width there for it not to feel cramped.
export function TopMatchCard({ person }: { person: TopMatchPerson }) {
  return (
    <Link
      href={`/compare/${person.username}`}
      className="flex flex-col gap-3 py-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-4">
        <Avatar
          src={person.avatarUrl}
          name={person.username}
          imageSize={48}
          sizeClassName="size-12"
          textClassName="text-base"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {person.displayName ? (
            <span className="truncate font-semibold text-foreground">
              {person.displayName}
            </span>
          ) : (
            <span className="truncate font-semibold text-foreground">
              @{person.username}
            </span>
          )}
          {person.displayName && (
            <span className="truncate text-sm text-muted-foreground">
              @{person.username}
            </span>
          )}
          <MatchBadge percentage={person.matchPercentage} />
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
      </div>

      {person.topFavorites.length > 0 && (
        <div className="flex flex-col gap-1.5 sm:hidden">
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
    </Link>
  );
}
