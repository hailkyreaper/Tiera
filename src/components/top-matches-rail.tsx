import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTopMatches } from "@/lib/db/top-matches";
import { BookCover } from "@/components/book-cover";
import { Avatar } from "@/components/avatar";
import { MatchBadge } from "@/components/match-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RAIL_LIMIT = 4;

// Desktop-only right rail, Explore only (not app-wide like Sidebar) — a
// preview of the existing Compare/Top Matches feature, not a new one.
// Matches the mockup's actual proportions (design/Desktop.png): a plain
// divided list, not individual bordered cards — avatar + stacked name/
// @username on the left, a match% pill top-right of each row. Top-favorite
// covers were dropped in an earlier pass (to strictly match the mockup,
// which doesn't show them here) then asked back in — kept the covers strip
// but still skip the genres text line and the mockup's tier-letter badges
// (not backed by any real computed data), so each row stays closer to a
// list item than a full card. `includeDetails: true` (the default) since
// this now does render favorites.
export async function TopMatchesRail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const matches = await getTopMatches(supabase, user.id, {
    limit: RAIL_LIMIT,
  });

  return (
    <aside className="sticky top-4 hidden h-fit w-96 shrink-0 flex-col gap-4 rounded-sm bg-card p-6 xl:flex">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Top Matches</h2>
        <Link href="/compare" className="text-sm font-medium text-primary">
          View all
        </Link>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Rank some books to see who you match with.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {matches.map((person) => (
            <Link
              key={person.userId}
              href={`/compare/${person.username}`}
              className="flex flex-col gap-2.5 py-3.5 hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={person.avatarUrl}
                  name={person.username}
                  imageSize={48}
                  sizeClassName="size-12"
                  textClassName="text-base"
                />

                <div className="min-w-0 flex-1">
                  {person.displayName && (
                    <div className="truncate text-base font-semibold text-foreground">
                      {person.displayName}
                    </div>
                  )}
                  <div
                    className={cn(
                      "truncate",
                      person.displayName
                        ? "text-sm text-muted-foreground"
                        : "text-base font-semibold text-foreground",
                    )}
                  >
                    @{person.username}
                  </div>
                </div>

                <MatchBadge percentage={person.matchPercentage} />
              </div>

              {person.topFavorites.length > 0 && (
                <div className="flex gap-2 pl-[60px]">
                  {person.topFavorites.map((book) => (
                    <div key={book.bookId} className="w-12 shrink-0">
                      <BookCover src={book.thumbnail} alt={book.title} size={48} />
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/compare"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <Users className="size-4" />
        Find more matches
      </Link>
    </aside>
  );
}
