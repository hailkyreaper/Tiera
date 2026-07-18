import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTrendingSearches } from "@/lib/db/search-queries";

// Real trending searches (design2/02) — backed by the new search_queries
// log table (migration 0026), not a fabricated list. Empty until real
// searches accumulate, which is correct: nothing has been logged yet.
export async function TrendingSearchesRail() {
  const supabase = await createClient();
  const searches = await getTrendingSearches(supabase);

  if (searches.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-sm bg-card p-6">
      <h2 className="text-base font-semibold text-foreground">
        Trending Searches
      </h2>

      <div className="flex flex-col gap-3">
        {searches.map((term) => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}&type=books`}
            className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
          >
            <TrendingUp className="size-4 shrink-0 text-primary" />
            <span className="truncate">{term}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
