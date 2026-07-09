import type { createClient } from "@/lib/supabase/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const TIER_SCORES: Record<string, number> = {
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

export async function getBookScores(
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

// Pure comparison of two users' book-score maps — shared by Compare's
// per-pair summary and Recommendations' scan across many candidate users.
export function computeMatch(
  scoresA: Map<string, number>,
  scoresB: Map<string, number>,
): TasteMatch {
  let totalAgreement = 0;
  let sharedBookCount = 0;

  for (const [bookId, scoreA] of scoresA) {
    const scoreB = scoresB.get(bookId);
    if (scoreB === undefined) continue;

    totalAgreement += 1 - Math.abs(scoreA - scoreB) / MAX_DIFF;
    sharedBookCount += 1;
  }

  if (sharedBookCount < MIN_SHARED_BOOKS) {
    return { percentage: null, sharedBookCount };
  }

  return {
    percentage: Math.round((totalAgreement / sharedBookCount) * 100),
    sharedBookCount,
  };
}

export type SharedBook = {
  bookId: string;
  title: string;
  authors: string[] | null;
  thumbnail: string | null;
  scoreA: number;
  scoreB: number;
};

export type ComparisonSummary = {
  match: TasteMatch;
  bothLove: SharedBook[];
  disagreeOn: SharedBook[];
  sharedDislikes: SharedBook[];
};

type BookRow = {
  id: string;
  title: string;
  authors: string[] | null;
  thumbnail_url: string | null;
};

// Both users rated the book A-tier or higher.
const BOTH_LOVE_THRESHOLD = TIER_SCORES.A;

// Both users rated the book C-tier or lower — the mirror of
// BOTH_LOVE_THRESHOLD, leaving B as a neutral middle ground that counts as
// neither a shared favorite nor a shared dislike.
const BOTH_DISLIKE_THRESHOLD = TIER_SCORES.C;

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

  const match = computeMatch(scoresA, scoresB);

  const sharedIds: string[] = [];
  const rawShared = new Map<string, { scoreA: number; scoreB: number }>();

  for (const [bookId, scoreA] of scoresA) {
    const scoreB = scoresB.get(bookId);
    if (scoreB === undefined) continue;

    sharedIds.push(bookId);
    rawShared.set(bookId, { scoreA, scoreB });
  }

  if (sharedIds.length === 0) {
    return { match, bothLove: [], disagreeOn: [], sharedDislikes: [] };
  }

  const { data: books } = await supabase
    .from("books")
    .select("id, title, authors, thumbnail_url")
    .in("id", sharedIds)
    .returns<BookRow[]>();

  const shared: SharedBook[] = (books ?? []).map((book) => ({
    bookId: book.id,
    title: book.title,
    authors: book.authors,
    thumbnail: book.thumbnail_url,
    scoreA: rawShared.get(book.id)!.scoreA,
    scoreB: rawShared.get(book.id)!.scoreB,
  }));

  const bothLove = shared
    .filter((b) => b.scoreA >= BOTH_LOVE_THRESHOLD && b.scoreB >= BOTH_LOVE_THRESHOLD)
    .sort((a, b) => b.scoreA + b.scoreB - (a.scoreA + a.scoreB));

  const sharedDislikes = shared
    .filter((b) => b.scoreA <= BOTH_DISLIKE_THRESHOLD && b.scoreB <= BOTH_DISLIKE_THRESHOLD)
    .sort((a, b) => a.scoreA + a.scoreB - (b.scoreA + b.scoreB));

  const disagreeOn = shared
    .filter((b) => Math.abs(b.scoreA - b.scoreB) >= DISAGREEMENT_THRESHOLD)
    .sort(
      (a, b) => Math.abs(b.scoreA - b.scoreB) - Math.abs(a.scoreA - a.scoreB),
    );

  return { match, bothLove, disagreeOn, sharedDislikes };
}

const SCORE_TO_TIER: Record<number, string> = Object.fromEntries(
  Object.entries(TIER_SCORES).map(([tier, score]) => [score, tier]),
);

export function scoreToTier(score: number): string {
  return SCORE_TO_TIER[Math.round(score)] ?? "?";
}

type RecommendationBookRow = {
  id: string;
  title: string;
  authors: string[] | null;
  thumbnail_url: string | null;
};

// Backs getMatchRecommendations: the other user's books, ranked by their own
// score, excluding anything the viewer already has in their library or has
// ranked directly (covers older rows from before library-syncing existed) —
// de-duped by title too, since the catalog can contain duplicate rows for
// the same real book (e.g. two different editions added separately).
async function getRankedRecommendationCandidates(
  supabase: SupabaseServerClient,
  viewerId: string,
  otherId: string,
): Promise<{ book: RecommendationBookRow; score: number }[]> {
  const [otherScores, viewerScores, { data: libraryRows }] = await Promise.all([
    getBookScores(supabase, otherId),
    getBookScores(supabase, viewerId),
    supabase.from("user_books").select("book_id").eq("user_id", viewerId),
  ]);

  const viewerLibrary = new Set([
    ...(libraryRows ?? []).map((row) => row.book_id as string),
    ...viewerScores.keys(),
  ]);

  const candidateIds = [...otherScores.keys()].filter(
    (bookId) => !viewerLibrary.has(bookId),
  );

  if (candidateIds.length === 0) return [];

  const { data: viewerBookRows } =
    viewerLibrary.size > 0
      ? await supabase
          .from("books")
          .select("id, title")
          .in("id", [...viewerLibrary])
          .returns<{ id: string; title: string }[]>()
      : { data: [] as { id: string; title: string }[] };

  const viewerTitles = new Set(
    (viewerBookRows ?? []).map((book) => book.title.trim().toLowerCase()),
  );

  const { data: candidateBooks } = await supabase
    .from("books")
    .select("id, title, authors, thumbnail_url")
    .in("id", candidateIds)
    .returns<RecommendationBookRow[]>();

  return (candidateBooks ?? [])
    .filter((book) => !viewerTitles.has(book.title.trim().toLowerCase()))
    .map((book) => ({ book, score: otherScores.get(book.id)! }))
    .sort((a, b) => b.score - a.score);
}

export type MatchRecommendation = {
  bookId: string;
  title: string;
  authors: string[] | null;
  thumbnail: string | null;
  matchPercentage: number;
};

// "Based on this match, you might like" — the other user's top N
// highest-rated books the viewer doesn't have, each with a per-book
// confidence % (their own score for that book, scaled to a percentage).
export async function getMatchRecommendations(
  supabase: SupabaseServerClient,
  viewerId: string,
  otherId: string,
  limit = 4,
): Promise<MatchRecommendation[]> {
  const candidates = await getRankedRecommendationCandidates(
    supabase,
    viewerId,
    otherId,
  );

  return candidates.slice(0, limit).map(({ book, score }) => ({
    bookId: book.id,
    title: book.title,
    authors: book.authors,
    thumbnail: book.thumbnail_url,
    matchPercentage: Math.round((score / TIER_SCORES.S) * 100),
  }));
}
