import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const TIER_SCORES: Record<string, number> = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
};

const MAX_DIFF = 5; // largest possible gap: S (6) vs F (1)
const MIN_SHARED_BOOKS = 3;

type RankedRow = { book_id: string; tier: string };

async function getBookScores(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Map<string, number>> {
  const { data: myLists } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("user_id", userId);

  const listIds = (myLists ?? []).map((list) => list.id);
  if (listIds.length === 0) return new Map();

  const { data: rankedItems } = await supabase
    .from("tier_list_items")
    .select("book_id, tier")
    .in("tier_list_id", listIds)
    .neq("tier", "unranked")
    .returns<RankedRow[]>();

  // Average a user's own tier score for a book across every list it
  // appears in, so it only counts once toward the comparison.
  const bookScores = new Map<string, { sum: number; count: number }>();

  for (const item of rankedItems ?? []) {
    const score = TIER_SCORES[item.tier];
    if (!score) continue;
    const entry = bookScores.get(item.book_id) ?? { sum: 0, count: 0 };
    entry.sum += score;
    entry.count += 1;
    bookScores.set(item.book_id, entry);
  }

  const averaged = new Map<string, number>();
  for (const [bookId, { sum, count }] of bookScores) {
    averaged.set(bookId, sum / count);
  }
  return averaged;
}

export type TasteMatch = {
  percentage: number | null;
  sharedBookCount: number;
};

export type SharedBook = {
  bookId: string;
  title: string;
  thumbnail: string | null;
  scoreA: number;
  scoreB: number;
};

export type ComparisonSummary = {
  match: TasteMatch;
  bothLove: SharedBook[];
  disagreeOn: SharedBook[];
};

type BookRow = { id: string; title: string; thumbnail_url: string | null };

// Both users rated the book A-tier or higher.
const BOTH_LOVE_THRESHOLD = TIER_SCORES.A;

// A 1-tier gap (e.g. B vs A) is normal variance, not a real disagreement —
// require at least a 2-tier gap before it counts as one.
const DISAGREEMENT_THRESHOLD = 2;

export async function getComparisonSummary(
  supabase: SupabaseServerClient,
  userIdA: string,
  userIdB: string,
): Promise<ComparisonSummary> {
  const [scoresA, scoresB] = await Promise.all([
    getBookScores(supabase, userIdA),
    getBookScores(supabase, userIdB),
  ]);

  let totalAgreement = 0;
  let sharedBookCount = 0;
  const sharedIds: string[] = [];
  const rawShared = new Map<string, { scoreA: number; scoreB: number }>();

  for (const [bookId, scoreA] of scoresA) {
    const scoreB = scoresB.get(bookId);
    if (scoreB === undefined) continue;

    totalAgreement += 1 - Math.abs(scoreA - scoreB) / MAX_DIFF;
    sharedBookCount += 1;
    sharedIds.push(bookId);
    rawShared.set(bookId, { scoreA, scoreB });
  }

  const match: TasteMatch =
    sharedBookCount < MIN_SHARED_BOOKS
      ? { percentage: null, sharedBookCount }
      : {
          percentage: Math.round((totalAgreement / sharedBookCount) * 100),
          sharedBookCount,
        };

  if (sharedIds.length === 0) {
    return { match, bothLove: [], disagreeOn: [] };
  }

  const { data: books } = await supabase
    .from("books")
    .select("id, title, thumbnail_url")
    .in("id", sharedIds)
    .returns<BookRow[]>();

  const shared: SharedBook[] = (books ?? []).map((book) => ({
    bookId: book.id,
    title: book.title,
    thumbnail: book.thumbnail_url,
    scoreA: rawShared.get(book.id)!.scoreA,
    scoreB: rawShared.get(book.id)!.scoreB,
  }));

  const bothLove = shared
    .filter((b) => b.scoreA >= BOTH_LOVE_THRESHOLD && b.scoreB >= BOTH_LOVE_THRESHOLD)
    .sort((a, b) => b.scoreA + b.scoreB - (a.scoreA + a.scoreB));

  const disagreeOn = shared
    .filter((b) => Math.abs(b.scoreA - b.scoreB) >= DISAGREEMENT_THRESHOLD)
    .sort(
      (a, b) => Math.abs(b.scoreA - b.scoreB) - Math.abs(a.scoreA - a.scoreB),
    );

  return { match, bothLove, disagreeOn };
}

const SCORE_TO_TIER: Record<number, string> = Object.fromEntries(
  Object.entries(TIER_SCORES).map(([tier, score]) => [score, tier]),
);

export type Recommendation = {
  bookId: string;
  title: string;
  authors: string[] | null;
  thumbnail: string | null;
  tier: string;
};

type RecommendationBookRow = {
  id: string;
  title: string;
  authors: string[] | null;
  thumbnail_url: string | null;
};

// The other user's highest-rated book that the viewer doesn't already have
// in their library (so we never "recommend" something they already know).
export async function getTopRecommendation(
  supabase: SupabaseServerClient,
  viewerId: string,
  otherId: string,
): Promise<Recommendation | null> {
  const [otherScores, { data: libraryRows }] = await Promise.all([
    getBookScores(supabase, otherId),
    supabase.from("user_books").select("book_id").eq("user_id", viewerId),
  ]);

  const viewerLibrary = new Set(
    (libraryRows ?? []).map((row) => row.book_id as string),
  );

  let bestBookId: string | null = null;
  let bestScore = -Infinity;

  for (const [bookId, score] of otherScores) {
    if (viewerLibrary.has(bookId)) continue;
    if (score > bestScore) {
      bestScore = score;
      bestBookId = bookId;
    }
  }

  if (!bestBookId) return null;

  const { data: book } = await supabase
    .from("books")
    .select("id, title, authors, thumbnail_url")
    .eq("id", bestBookId)
    .maybeSingle<RecommendationBookRow>();

  if (!book) return null;

  return {
    bookId: book.id,
    title: book.title,
    authors: book.authors,
    thumbnail: book.thumbnail_url,
    tier: SCORE_TO_TIER[Math.round(bestScore)] ?? "?",
  };
}
