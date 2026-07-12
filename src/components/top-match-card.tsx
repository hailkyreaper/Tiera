import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { Avatar } from "@/components/avatar";
import { MatchBadge } from "@/components/match-badge";
import type { TopMatchPerson } from "@/lib/db/top-matches";

export function TopMatchCard({ person }: { person: TopMatchPerson }) {
  return (
    <Link
      href={`/compare/${person.username}`}
      className="flex flex-col gap-3 rounded-sm bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <Avatar
          src={person.avatarUrl}
          name={person.username}
          imageSize={48}
          sizeClassName="size-12"
          textClassName="text-base"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {person.displayName && (
            <span className="truncate font-semibold text-foreground">
              {person.displayName}
            </span>
          )}
          <span
            className={
              person.displayName
                ? "truncate text-sm text-muted-foreground"
                : "truncate font-semibold text-foreground"
            }
          >
            @{person.username}
          </span>
          <MatchBadge percentage={person.matchPercentage} />
          <span className="text-xs text-muted-foreground">
            {person.booksRankedCount} books ranked
          </span>
          {person.topGenres.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {person.topGenres.join(" • ")}
            </span>
          )}
        </div>

        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </div>

      {person.topFavorites.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            Top Favorites
          </span>
          <div className="flex gap-2">
            {person.topFavorites.map((book) => (
              <div key={book.bookId} className="w-14 shrink-0">
                <BookCover src={book.thumbnail} alt={book.title} size={56} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
