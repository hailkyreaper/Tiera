import {
  computeMatch,
  getBookScores,
  TIER_SCORES,
  type SupabaseServerClient,
} from "@/lib/db/taste-match";

// Only recommend books a similar user rated A-tier or better.
const RECOMMENDATION_TIER_THRESHOLD = TIER_SCORES.A;

// How many of the most-similar users to draw recommendations from. Prefers
// 85%+ matches, but naturally falls back to whoever's most similar when
// fewer than this many exist (small user base), so the screen isn't empty.
const CANDIDATE_POOL_SIZE = 5;

export type BookRecommendation = {
  bookId: string;
  title: string;
  authors: string[] | null;
  thumbnail: string | null;
  matchPercentage: number;
};

export type RecommendationsResult = {
  recommendations: BookRecommendation[];
  // The lowest match % among the users actually contributing recommendations
  // — true statement for a subtitle like "Based on users with X%+ similarity".
  usedThreshold: number | null;
};

type ProfileRow = { id: string };
type BookRow = {
  id: string;
  title: string;
  authors: string[] | null;
  thumbnail_url: string | null;
};

export async function getRecommendations(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 5,
): Promise<RecommendationsResult> {
  const [myScores, { data: profiles }, { data: libraryRows }] =
    await Promise.all([
      getBookScores(supabase, userId),
      supabase
        .from("profiles")
        .select("id")
        .neq("id", userId)
        .returns<ProfileRow[]>(),
      supabase.from("user_books").select("book_id").eq("user_id", userId),
    ]);

  // Exclude anything already in the user's library *or* already ranked by
  // them directly — covers older accounts/rows from before library-syncing
  // existed, so a book they've already rated never resurfaces as "new".
  const myLibrary = new Set([
    ...(libraryRows ?? []).map((row) => row.book_id as string),
    ...myScores.keys(),
  ]);

  // The catalog can contain duplicate rows for the same real book (e.g. two
  // different editions added separately) — exclude by title too, so a book
  // the user already has under one row's id doesn't resurface under the
  // other row's id.
  const myLibraryIds = [...myLibrary];
  const { data: myBookRows } =
    myLibraryIds.length > 0
      ? await supabase
          .from("books")
          .select("id, title")
          .in("id", myLibraryIds)
          .returns<{ id: string; title: string }[]>()
      : { data: [] as { id: string; title: string }[] };

  const myTitles = new Set(
    (myBookRows ?? []).map((book) => book.title.trim().toLowerCase()),
  );

  const candidates: { percentage: number; scores: Map<string, number> }[] =
    [];

  for (const profile of profiles ?? []) {
    const theirScores = await getBookScores(supabase, profile.id);
    const match = computeMatch(myScores, theirScores);
    if (match.percentage === null) continue;
    candidates.push({ percentage: match.percentage, scores: theirScores });
  }

  candidates.sort((a, b) => b.percentage - a.percentage);
  const pool = candidates.slice(0, CANDIDATE_POOL_SIZE);

  if (pool.length === 0) {
    return { recommendations: [], usedThreshold: null };
  }

  const usedThreshold = pool[pool.length - 1].percentage;

  // Dedupe books recommended by multiple similar users, keeping the
  // highest match % among whoever rated it highly.
  const bestByBook = new Map<string, number>();

  for (const candidate of pool) {
    for (const [bookId, score] of candidate.scores) {
      if (score < RECOMMENDATION_TIER_THRESHOLD) continue;
      if (myLibrary.has(bookId)) continue;

      const existing = bestByBook.get(bookId);
      if (existing === undefined || candidate.percentage > existing) {
        bestByBook.set(bookId, candidate.percentage);
      }
    }
  }

  const bookIds = [...bestByBook.keys()];
  if (bookIds.length === 0) {
    return { recommendations: [], usedThreshold };
  }

  const { data: books } = await supabase
    .from("books")
    .select("id, title, authors, thumbnail_url")
    .in("id", bookIds)
    .returns<BookRow[]>();

  const recommendations: BookRecommendation[] = (books ?? [])
    .filter((book) => !myTitles.has(book.title.trim().toLowerCase()))
    .map((book) => ({
      bookId: book.id,
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail_url,
      matchPercentage: bestByBook.get(book.id)!,
    }))
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, limit);

  return { recommendations, usedThreshold };
}
