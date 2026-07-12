import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTopMatches } from "@/lib/db/top-matches";
import { TopMatchCard } from "@/components/top-match-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RAIL_LIMIT = 3;

// Desktop-only right rail, Explore only (not app-wide like Sidebar) — a
// preview of the existing Compare/Top Matches feature, not a new one.
// Reuses the real TopMatchCard (genres + top-favorite covers) rather than a
// stripped-down version — the compact avatar/name/match% row this replaced
// read as too thin. TopMatchCard was built for Compare's own `max-w-md`
// (448px) container, so this rail is sized wider than a typical sidebar
// rail to give it the same room, and `includeDetails` stays at its default
// (true) to actually fetch what it renders.
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
    <aside className="sticky top-4 hidden h-fit w-96 shrink-0 flex-col gap-3 xl:flex">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">Top Matches</h2>
        <Link href="/compare" className="text-xs font-medium text-primary">
          View all
        </Link>
      </div>

      {matches.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">
          Rank some books to see who you match with.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((person) => (
            <TopMatchCard key={person.userId} person={person} />
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
