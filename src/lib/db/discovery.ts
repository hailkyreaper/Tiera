import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type TrendingBook = {
  bookId: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
};

type TrendingItemRow = {
  book_id: string;
  books: {
    id: string;
    title: string;
    authors: string[] | null;
    thumbnail_url: string | null;
  };
};

const TRENDING_WINDOW_DAYS = 7;

// "Trending This Week" — site-wide, ranked by how many times the book was
// added to a list in the last 7 days. Deliberately not personalized — this
// is meant to reflect real recent activity, not one viewer's own taste.
//
// Tallies tier_list_items rather than user_books (any tier, unranked
// included — landing on a list at all is itself a recent-interest signal).
// This isn't just a style choice: user_books' SELECT policy is strictly
// owner-scoped (`auth.uid() = user_id`, see migration 0002, no public-read
// policy at all), so a "site-wide" tally over it would silently only ever
// see the current viewer's own recent adds under RLS — which is exactly why
// this panel was rendering empty (or wrong) for everyone. tier_list_items
// already has a real public-read policy for public lists (migration 0004),
// the same one getPopularGenres below already relies on, so this reuses an
// already-public data source instead of needing any RLS/migration change.
export async function getTrendingThisWeek(
  supabase: SupabaseServerClient,
  limit = 4,
): Promise<TrendingBook[]> {
  const since = new Date(
    Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: items } = await supabase
    .from("tier_list_items")
    .select("book_id, books(id, title, authors, thumbnail_url)")
    .gte("created_at", since)
    .returns<TrendingItemRow[]>();

  const tally = new Map<string, number>();
  const bookById = new Map<string, TrendingItemRow["books"]>();
  for (const item of items ?? []) {
    tally.set(item.book_id, (tally.get(item.book_id) ?? 0) + 1);
    if (!bookById.has(item.book_id)) bookById.set(item.book_id, item.books);
  }

  const topIds = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return topIds
    .map((id) => bookById.get(id))
    .filter((book): book is TrendingItemRow["books"] => !!book)
    .map((book) => ({
      bookId: book.id,
      title: book.title,
      authors: book.authors ?? [],
      thumbnail: book.thumbnail_url,
    }));
}

type CategoryRow = { books: { categories: string[] | null } };

const POPULAR_GENRES_LIMIT = 3;

// Site-wide top genres — same tally approach as top-matches.ts's per-user
// getTopGenres, just across every ranked tier_list_items row instead of one
// person's, to surface what the whole app is into right now.
export async function getPopularGenres(
  supabase: SupabaseServerClient,
  limit = POPULAR_GENRES_LIMIT,
): Promise<string[]> {
  const { data: items } = await supabase
    .from("tier_list_items")
    .select("books(categories)")
    .neq("tier", "unranked")
    .returns<CategoryRow[]>();

  const tally = new Map<string, number>();
  for (const item of items ?? []) {
    for (const category of item.books.categories ?? []) {
      tally.set(category, (tally.get(category) ?? 0) + 1);
    }
  }

  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category);
}

type CategoriesOnlyRow = { categories: string[] | null };

// Every distinct genre in the catalog — powers Search's Filter panel's
// Genre dropdown with real values instead of a hardcoded/guessed list.
export async function getAllGenres(
  supabase: SupabaseServerClient,
): Promise<string[]> {
  const { data } = await supabase
    .from("books")
    .select("categories")
    .not("categories", "is", null)
    .returns<CategoriesOnlyRow[]>();

  const genres = new Set<string>();
  for (const row of data ?? []) {
    for (const category of row.categories ?? []) {
      genres.add(category);
    }
  }

  return [...genres].sort();
}
