import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Backs the Trending Searches rail (design2/02) with real usage instead of
// a fabricated list. Logs every real book search, including repeats —
// searching the same thing again is itself a legitimate trending signal,
// not a bug to dedupe away. A failed insert shouldn't break search, so
// errors aren't surfaced (matches this codebase's existing style of not
// checking insert errors for non-critical writes, e.g. user_books upserts).
export async function logSearchQuery(
  supabase: SupabaseServerClient,
  query: string,
  userId: string | null,
): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  await supabase.from("search_queries").insert({ query: trimmed, user_id: userId });
}

const TRENDING_SEARCHES_WINDOW_DAYS = 30;
const TRENDING_SEARCHES_SAMPLE_SIZE = 500;

// Tallies the most frequent recent search terms (case/whitespace-
// normalized), same JS-side tally approach as getTopGenres/
// getTrendingThisWeek rather than a Postgres group-by RPC.
export async function getTrendingSearches(
  supabase: SupabaseServerClient,
  limit = 5,
): Promise<string[]> {
  const since = new Date(
    Date.now() - TRENDING_SEARCHES_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data } = await supabase
    .from("search_queries")
    .select("query")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(TRENDING_SEARCHES_SAMPLE_SIZE);

  const tally = new Map<string, number>();
  for (const row of data ?? []) {
    const normalized = (row.query as string).trim().toLowerCase();
    if (!normalized) continue;
    tally.set(normalized, (tally.get(normalized) ?? 0) + 1);
  }

  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query]) => query);
}
