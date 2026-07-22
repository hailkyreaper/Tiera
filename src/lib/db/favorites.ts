import type { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type FavoriteBook = {
  bookId: string;
  title: string;
  thumbnail: string | null;
};

type BookJoin = { id: string; title: string; thumbnail_url: string | null };
type RankedRow = { tier: "S" | "A"; book_id: string; books: BookJoin };

export async function getFavoriteBooks(
  supabase: SupabaseServerClient,
  userId: string,
  limit?: number,
): Promise<FavoriteBook[]> {
  const myLists = assertNoSupabaseError(
    await supabase.from("tier_lists").select("id").eq("user_id", userId),
    "fetching lists for favorites",
  );

  const listIds = (myLists ?? []).map((list) => list.id);
  if (listIds.length === 0) return [];

  const rankedItems = assertNoSupabaseError(
    await supabase
      .from("tier_list_items")
      .select("tier, book_id, books(id, title, thumbnail_url)")
      .in("tier_list_id", listIds)
      .in("tier", ["S", "A"])
      .order("created_at", { ascending: false })
      .returns<RankedRow[]>(),
    "fetching ranked items for favorites",
  );

  const seen = new Set<string>();
  const books: FavoriteBook[] = [];

  // Fill with S-tier first, then A, so a thin S-tier shelf still shows a
  // full row of favorites.
  for (const tier of ["S", "A"] as const) {
    for (const item of rankedItems ?? []) {
      if (limit !== undefined && books.length >= limit) break;
      if (item.tier !== tier || seen.has(item.books.id)) continue;
      seen.add(item.books.id);
      books.push({
        bookId: item.books.id,
        title: item.books.title,
        thumbnail: item.books.thumbnail_url,
      });
    }
    if (limit !== undefined && books.length >= limit) break;
  }

  return books;
}
