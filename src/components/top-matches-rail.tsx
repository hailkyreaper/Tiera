import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTopMatches } from "@/lib/db/top-matches";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RAIL_LIMIT = 4;

// Desktop-only right rail, Explore only (not app-wide like Sidebar) — a
// preview of the existing Compare/Top Matches feature, not a new one.
// Matches the mockup's actual proportions (design/Desktop.png): a plain
// divided list, not individual bordered cards — avatar + stacked name/
// @username on the left, a match% pill top-right of each row. No genres/
// top-favorite covers (that's TopMatchCard, used on Compare's own page —
// too tall for a rail, per user feedback: "the current one looks weak"
// then "its one full card" once it was swapped in) and no tier-letter
// badges (mockup shows those, but they're not backed by any real computed
// data in the app today — user's call to skip rather than invent meaning
// for them). `includeDetails: false` since none of that data is rendered.
export async function TopMatchesRail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const matches = await getTopMatches(supabase, user.id, {
    includeDetails: false,
    limit: RAIL_LIMIT,
  });

  return (
    <aside className="sticky top-4 hidden h-fit w-80 shrink-0 flex-col gap-3 rounded-sm bg-card p-4 xl:flex">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Top Matches</h2>
        <Link href="/compare" className="text-xs font-medium text-primary">
          View all
        </Link>
      </div>

      {matches.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Rank some books to see who you match with.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {matches.map((person) => (
            <Link
              key={person.userId}
              href={`/compare/${person.username}`}
              className="flex items-center gap-3 py-3 hover:bg-muted"
            >
              {person.avatarUrl ? (
                <Image
                  src={person.avatarUrl}
                  alt={person.username}
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {person.username[0]?.toUpperCase() ?? "?"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                {person.displayName && (
                  <div className="truncate text-sm font-semibold text-foreground">
                    {person.displayName}
                  </div>
                )}
                <div
                  className={cn(
                    "truncate",
                    person.displayName
                      ? "text-xs text-muted-foreground"
                      : "text-sm font-semibold text-foreground",
                  )}
                >
                  @{person.username}
                </div>
              </div>

              <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                {person.matchPercentage}% match
              </span>
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
