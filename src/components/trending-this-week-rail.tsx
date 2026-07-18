import { createClient } from "@/lib/supabase/server";
import { getTrendingThisWeek } from "@/lib/db/discovery";
import { BookCover } from "@/components/book-cover";

const RAIL_LIMIT = 4;

// Explore-only panel (design2/01) — numbered ranking, site-wide activity
// over the last 7 days (see getTrendingThisWeek), not a static rating like
// Search's Trending Books rail.
export async function TrendingThisWeekRail() {
  const supabase = await createClient();
  const books = await getTrendingThisWeek(supabase, RAIL_LIMIT);

  if (books.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-sm bg-card p-6">
      <h2 className="text-base font-semibold text-foreground">
        Trending This Week
      </h2>

      <div className="flex flex-col gap-3">
        {books.map((book, index) => (
          <div key={book.bookId} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-sm font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="w-10 shrink-0">
              <BookCover src={book.thumbnail} alt={book.title} size={40} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {book.title}
              </p>
              {book.authors.length > 0 && (
                <p className="truncate text-xs text-muted-foreground">
                  by {book.authors.join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
