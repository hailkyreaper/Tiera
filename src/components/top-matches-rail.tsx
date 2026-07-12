import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTopMatches } from "@/lib/db/top-matches";

const RAIL_LIMIT = 4;

// Desktop-only right rail, Explore only (not app-wide like Sidebar) — a
// compact preview of the existing Compare/Top Matches feature, not a new
// one. Deliberately lighter than TopMatchCard (no genres/top-favorite
// covers): those cost two extra per-candidate queries in getTopMatches that
// a narrow rail has no room to show anyway, so it asks for
// `includeDetails: false` rather than fetching data nothing renders.
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
    <aside className="sticky top-4 hidden h-fit w-72 shrink-0 flex-col gap-3 rounded-sm bg-card p-4 xl:flex">
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
        <div className="flex flex-col gap-1">
          {matches.map((person) => (
            <Link
              key={person.userId}
              href={`/compare/${person.username}`}
              className="flex items-center gap-3 rounded-sm p-2 hover:bg-muted"
            >
              {person.avatarUrl ? (
                <Image
                  src={person.avatarUrl}
                  alt={person.username}
                  width={36}
                  height={36}
                  className="size-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {person.username[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                @{person.username}
              </span>
              <span className="shrink-0 text-xs font-medium text-primary">
                {person.matchPercentage}%
              </span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
