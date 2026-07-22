import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTopMatches } from "@/lib/db/top-matches";
import { Avatar } from "@/components/avatar";
import { MatchBadge } from "@/components/match-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RAIL_LIMIT = 4;

// Desktop-only right rail, Explore only (not app-wide like Sidebar) — a
// preview of the existing Compare/Top Matches feature, not a new one.
// Matches design2/01_Explore_Desktop.png exactly: a small, plain divided
// list — one line per person (small avatar, @username or display name, a
// match% pill), no genres, no favorite covers, no tier-letter badges (that
// last one still isn't backed by any real computed data). Went through a
// bigger card-style version first; this compact form is what the mockup
// actually shows. `includeDetails: false` since nothing here needs
// topGenres/topFavorites anymore — skips those two extra per-candidate
// queries entirely.
//
// No `<aside>`/sticky/width wrapper of its own — Explore now stacks this
// alongside TrendingThisWeekRail/PopularGenresRail (design2/01), so the
// single outer wrapper in explore/page.tsx owns sticky positioning and
// width, and each panel is just its own bg-card block.
export async function TopMatchesRail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const matches = await getTopMatches(supabase, user.id, {
    limit: RAIL_LIMIT,
    includeDetails: false,
  });

  return (
    <div className="flex flex-col gap-4 rounded-sm bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Top Matches</h2>
        <Link href="/compare" className="text-sm font-medium text-primary-link">
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
              className="flex items-center gap-3 py-2.5 hover:bg-muted"
            >
              <Avatar
                src={person.avatarUrl}
                name={person.username}
                imageSize={32}
                sizeClassName="size-8"
                textClassName="text-xs"
              />

              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {person.displayName ?? `@${person.username}`}
              </span>

              <MatchBadge
                percentage={person.matchPercentage}
                className="px-2 py-0.5 text-xs"
              />
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
    </div>
  );
}
