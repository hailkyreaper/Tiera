import type { createClient } from "@/lib/supabase/server";
import { resolveTag } from "@/lib/db/genre-taxonomy";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const TIER_SCORES: Record<string, number> = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
};

const MAX_SCORE = 6;
const MIN_BOOKS_TO_SHOW = 2;

export type GenreInsight = {
  genre: string;
  percentage: number;
};

type RankedRow = {
  tier: string;
  book_id: string;
  books: { categories: string[] | null };
};

export async function getGenreInsights(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{
  genres: GenreInsight[];
  learningGenres: string[];
  unmappedTags: string[];
}> {
  const { data: myLists } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("user_id", userId);

  const listIds = (myLists ?? []).map((list) => list.id);
  if (listIds.length === 0) {
    return { genres: [], learningGenres: [], unmappedTags: [] };
  }

  const { data: rankedItems } = await supabase
    .from("tier_list_items")
    .select("tier, book_id, books(categories)")
    .in("tier_list_id", listIds)
    .neq("tier", "unranked")
    .returns<RankedRow[]>();

  // Average each distinct book's tier score across every list it appears
  // in, so a book placed in multiple lists only counts once toward a
  // genre instead of inflating that genre's score per extra placement.
  const bookScores = new Map<
    string,
    { sum: number; count: number; categories: string[] | null }
  >();

  for (const item of rankedItems ?? []) {
    const score = TIER_SCORES[item.tier];
    if (!score) continue;

    const entry = bookScores.get(item.book_id) ?? {
      sum: 0,
      count: 0,
      categories: item.books.categories,
    };
    entry.sum += score;
    entry.count += 1;
    bookScores.set(item.book_id, entry);
  }

  const parentTotals = new Map<string, { sum: number; count: number }>();
  const unmappedTags = new Set<string>();

  for (const { sum, count, categories } of bookScores.values()) {
    const averageScore = sum / count;

    // A book may have several raw tags that all point at the same parent
    // genre — track a set per book so it only counts once, no matter how
    // many tags map there (e.g. "Epic Fantasy" and "Dark Fantasy" both
    // resolve to Fantasy, but shouldn't double-count the same book).
    const parentsForBook = new Set<string>();

    for (const rawTag of categories ?? []) {
      const resolution = resolveTag(rawTag);

      if (resolution.type === "unmapped") {
        unmappedTags.add(rawTag);
        continue;
      }
      if (resolution.type === "discard") continue;

      for (const { parent } of resolution.mappings) {
        parentsForBook.add(parent);
      }
    }

    for (const parent of parentsForBook) {
      const entry = parentTotals.get(parent) ?? { sum: 0, count: 0 };
      entry.sum += averageScore;
      entry.count += 1;
      parentTotals.set(parent, entry);
    }
  }

  const scored = Array.from(parentTotals.entries()).map(
    ([genre, { sum, count }]) => ({
      genre,
      percentage: Math.round((sum / count / MAX_SCORE) * 100),
      count,
    }),
  );

  scored.sort((a, b) => b.percentage - a.percentage);

  // A single book shouldn't be able to produce a displayed percentage —
  // genres below the threshold get named in a quiet note instead of their
  // own bar.
  const genres = scored
    .filter((entry) => entry.count >= MIN_BOOKS_TO_SHOW)
    .map(({ genre, percentage }) => ({ genre, percentage }));

  const learningGenres = scored
    .filter((entry) => entry.count < MIN_BOOKS_TO_SHOW)
    .map((entry) => entry.genre);

  return { genres, learningGenres, unmappedTags: [...unmappedTags] };
}
