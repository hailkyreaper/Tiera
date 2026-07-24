import type { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";

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

// A 1-tier gap (e.g. B vs A) is normal variance, not a real disagreement —
// require at least a 2-tier gap before it counts as one. Used both by
// computeMatch (the disagreement penalty below) and getComparisonSummary
// (the "Biggest Disagreements" list) — same definition everywhere.
const DISAGREEMENT_THRESHOLD = 2;

// A single shared book isn't enough to present a section as real insight
// (see the audit: a 1-book overlap was showing a confident "Top Shared
// Genre" tile and a populated "Biggest Differences" panel on a pair the
// headline itself called "not enough shared books yet"). Both Love/Shared
// Dislikes require this many qualifying books before they render as
// populated instead of "Nothing here yet."
export const MIN_PANEL_BOOKS = 2;

type RankedRow = { book_id: string; tier: string };

export async function getBookScores(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Map<string, number>> {
  const myLists = assertNoSupabaseError(
    await supabase.from("tier_lists").select("id").eq("user_id", userId),
    "fetching lists for book scores",
  );

  const listIds = (myLists ?? []).map((list) => list.id);
  if (listIds.length === 0) return new Map();

  const rankedItems = assertNoSupabaseError(
    await supabase
      .from("tier_list_items")
      .select("book_id, tier")
      .in("tier_list_id", listIds)
      .neq("tier", "unranked")
      .returns<RankedRow[]>(),
    "fetching ranked items for book scores",
  );

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

type BatchListRow = { id: string; user_id: string };
type BatchRankedRow = { tier_list_id: string; book_id: string; tier: string };

// Batched version of getBookScores for computing several users' score maps
// at once — 2 queries total instead of 2 per user. Same batch-fetch-then-
// group-in-memory approach getTopMatches (top-matches.ts) already uses;
// pulled out here so Explore's own per-creator match % (previously a
// sequential getBookScores call per creator — up to 2N round-trips for N
// creators shown on the feed) can use it too, without duplicating the
// batching logic a second time.
export async function getBookScoresForUsers(
  supabase: SupabaseServerClient,
  userIds: string[],
): Promise<Map<string, Map<string, number>>> {
  const result = new Map<string, Map<string, number>>();
  if (userIds.length === 0) return result;

  const lists = assertNoSupabaseError(
    await supabase
      .from("tier_lists")
      .select("id, user_id")
      .in("user_id", userIds)
      .returns<BatchListRow[]>(),
    "fetching lists for batched book scores",
  );

  const listIdToUserId = new Map((lists ?? []).map((l) => [l.id, l.user_id]));
  const listIds = [...listIdToUserId.keys()];
  if (listIds.length === 0) return result;

  const items = assertNoSupabaseError(
    await supabase
      .from("tier_list_items")
      .select("tier_list_id, book_id, tier")
      .in("tier_list_id", listIds)
      .neq("tier", "unranked")
      .returns<BatchRankedRow[]>(),
    "fetching ranked items for batched book scores",
  );

  const sums = new Map<string, Map<string, { sum: number; count: number }>>();
  for (const item of items ?? []) {
    const userId = listIdToUserId.get(item.tier_list_id);
    if (!userId) continue;
    const score = TIER_SCORES[item.tier];
    if (!score) continue;
    let userSums = sums.get(userId);
    if (!userSums) {
      userSums = new Map();
      sums.set(userId, userSums);
    }
    const entry = userSums.get(item.book_id) ?? { sum: 0, count: 0 };
    entry.sum += score;
    entry.count += 1;
    userSums.set(item.book_id, entry);
  }

  for (const [userId, userSums] of sums) {
    const averaged = new Map<string, number>();
    for (const [bookId, { sum, count }] of userSums) {
      averaged.set(bookId, sum / count);
    }
    result.set(userId, averaged);
  }

  return result;
}

export type TasteMatch = {
  percentage: number | null;
  sharedBookCount: number;
};

// Pure comparison of two users' book-score maps — shared by Compare's
// per-pair summary and Recommendations' scan across many candidate users.
//
// A plain mean of per-book agreement can't tell "consistently moderate
// agreement" apart from "a mix of real agreement and real disagreement" —
// two very different signals that can average out to the same number (see
// the Compare logic audit's follow-up: a pair with 2 close agreements and
// 2 real disagreements, one severe, still landed at a mildly-positive 65%).
// Real disagreements (>= DISAGREEMENT_THRESHOLD, the same bar
// getComparisonSummary's "Biggest Disagreements" already uses) now cost an
// *extra* penalty on top of their already-reduced agreement score — spread
// across every shared book, not just the disagreeing ones, so the same
// couple of disagreements barely register against a large pool of shared
// books but meaningfully drag down a thin one. This is what makes "18
// books agreed, 2 disagreed" score very differently from "2 agreed, 2
// disagreed" even though a plain mean wouldn't.
export function computeMatch(
  scoresA: Map<string, number>,
  scoresB: Map<string, number>,
): TasteMatch {
  let totalAgreement = 0;
  let totalDisagreementSeverity = 0;
  let sharedBookCount = 0;

  for (const [bookId, scoreA] of scoresA) {
    const scoreB = scoresB.get(bookId);
    if (scoreB === undefined) continue;

    const diff = Math.abs(scoreA - scoreB);
    totalAgreement += 1 - diff / MAX_DIFF;
    if (diff >= DISAGREEMENT_THRESHOLD) {
      totalDisagreementSeverity += diff / MAX_DIFF;
    }
    sharedBookCount += 1;
  }

  if (sharedBookCount < MIN_SHARED_BOOKS) {
    return { percentage: null, sharedBookCount };
  }

  const meanAgreement = totalAgreement / sharedBookCount;
  const disagreementPenalty = totalDisagreementSeverity / sharedBookCount;
  const adjusted = Math.min(Math.max(meanAgreement - disagreementPenalty, 0), 1);

  return {
    percentage: Math.round(adjusted * 100),
    sharedBookCount,
  };
}

export type SharedBook = {
  bookId: string;
  title: string;
  authors: string[] | null;
  thumbnail: string | null;
  categories: string[] | null;
  description: string | null;
  averageRating: number | null;
  scoreA: number;
  scoreB: number;
};

export type ComparisonSummary = {
  match: TasteMatch;
  bothLove: SharedBook[];
  disagreeOn: SharedBook[];
  sharedDislikes: SharedBook[];
  // Every book both users have ranked, unfiltered — powers the Shared Tier
  // List (design2/04), unlike bothLove/disagreeOn/sharedDislikes which are
  // each a narrow slice of it.
  shared: SharedBook[];
  // Most common category among bothLove books — "Top Shared Genre" stat.
  // null when there aren't at least MIN_PANEL_BOOKS of them (see that
  // constant's comment) — no fallback to all shared books anymore: that
  // used to let a single disagreement-heavy book produce a confident-
  // looking genre label with no real "you both love this" evidence behind
  // it at all.
  topSharedGenre: string | null;
};

type BookRow = {
  id: string;
  title: string;
  authors: string[] | null;
  thumbnail_url: string | null;
  categories: string[] | null;
  description: string | null;
  average_rating: number | null;
};

function tallyTopGenre(books: SharedBook[]): string | null {
  const tally = new Map<string, number>();
  for (const book of books) {
    for (const category of book.categories ?? []) {
      tally.set(category, (tally.get(category) ?? 0) + 1);
    }
  }
  if (tally.size === 0) return null;
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// Both users rated the book A-tier or higher.
const BOTH_LOVE_THRESHOLD = TIER_SCORES.A;

// Both users rated the book C-tier or lower — the mirror of
// BOTH_LOVE_THRESHOLD, leaving B as a neutral middle ground that counts as
// neither a shared favorite nor a shared dislike.
const BOTH_DISLIKE_THRESHOLD = TIER_SCORES.C;

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
    return {
      match,
      bothLove: [],
      disagreeOn: [],
      sharedDislikes: [],
      shared: [],
      topSharedGenre: null,
    };
  }

  const books = assertNoSupabaseError(
    await supabase
      .from("books")
      .select("id, title, authors, thumbnail_url, categories, description, average_rating")
      .in("id", sharedIds)
      .returns<BookRow[]>(),
    "fetching shared books for comparison summary",
  );

  const shared: SharedBook[] = (books ?? []).map((book) => ({
    bookId: book.id,
    title: book.title,
    authors: book.authors,
    thumbnail: book.thumbnail_url,
    categories: book.categories,
    description: book.description,
    averageRating: book.average_rating,
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

  const topSharedGenre =
    bothLove.length >= MIN_PANEL_BOOKS ? tallyTopGenre(bothLove) : null;

  return {
    match,
    bothLove,
    disagreeOn,
    sharedDislikes,
    shared,
    topSharedGenre,
  };
}

export type DiscoveryCounts = {
  // Their favorites (S/A tier) not in your library.
  viewerUnread: number;
  // Your favorites (S/A tier) not in their library.
  otherUnread: number;
};

const DISCOVERY_TIER_THRESHOLD = TIER_SCORES.A;

// Symmetric mirror of top-matches.ts's discoveryCount, for one already-known
// pair rather than a batch of candidates — backs the Compare detail page's
// "Favorites unread" / "They haven't read" stat tiles. Takes both people's
// already-fetched score maps (the caller already has these from
// getComparisonSummary's own inputs) rather than recomputing them here.
export async function getDiscoveryCounts(
  supabase: SupabaseServerClient,
  viewerId: string,
  otherId: string,
  viewerScores: Map<string, number>,
  otherScores: Map<string, number>,
): Promise<DiscoveryCounts> {
  const [viewerLibraryResult, otherLibraryResult] = await Promise.all([
    supabase.from("user_books").select("book_id").eq("user_id", viewerId),
    supabase.from("user_books").select("book_id").eq("user_id", otherId),
  ]);
  const viewerLibraryRows = assertNoSupabaseError(
    viewerLibraryResult,
    "fetching viewer's library for discovery counts",
  );
  const otherLibraryRows = assertNoSupabaseError(
    otherLibraryResult,
    "fetching other user's library for discovery counts",
  );

  const viewerLibrary = new Set([
    ...(viewerLibraryRows ?? []).map((row) => row.book_id as string),
    ...viewerScores.keys(),
  ]);
  const otherLibrary = new Set([
    ...(otherLibraryRows ?? []).map((row) => row.book_id as string),
    ...otherScores.keys(),
  ]);

  let viewerUnread = 0;
  for (const [bookId, score] of otherScores) {
    if (score >= DISCOVERY_TIER_THRESHOLD && !viewerLibrary.has(bookId)) {
      viewerUnread += 1;
    }
  }

  let otherUnread = 0;
  for (const [bookId, score] of viewerScores) {
    if (score >= DISCOVERY_TIER_THRESHOLD && !otherLibrary.has(bookId)) {
      otherUnread += 1;
    }
  }

  return { viewerUnread, otherUnread };
}

// "Genre alignment" — of the books you both ranked, what fraction share
// your Top Shared Genre? A real, derivable ratio (reuses the same `shared`
// array getComparisonSummary already returns, no new query) rather than an
// invented sub-score. null — renders nothing — whenever topSharedGenre
// itself is null, the same honesty rule that field already follows.
export function computeGenreAlignment(
  shared: SharedBook[],
  topSharedGenre: string | null,
): number | null {
  if (!topSharedGenre || shared.length === 0) return null;
  const matching = shared.filter((book) =>
    (book.categories ?? []).includes(topSharedGenre),
  ).length;
  return Math.round((matching / shared.length) * 100);
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
  categories: string[] | null;
  description: string | null;
  average_rating: number | null;
};

// Genres pulled from books both people rated similarly (not a real
// disagreement, same DISAGREEMENT_THRESHOLD definition used everywhere
// else) — this is "the part of their taste that's actually driving the
// match." Recommendations get scoped to these genres so a strong match
// built entirely on shared fantasy picks doesn't surface an unrelated
// thriller book just because the other person happened to rate it even
// higher — a real gap the flat "their single highest-rated book" approach
// had, raised directly by the user: someone could align great on fantasy
// specifically but read mostly thriller overall, and the old logic had no
// way to tell "this is the genre we actually agree on" from "this is their
// favorite genre overall."
export async function getAlignedGenres(
  supabase: SupabaseServerClient,
  scoresA: Map<string, number>,
  scoresB: Map<string, number>,
): Promise<Set<string>> {
  const alignedBookIds: string[] = [];
  for (const [bookId, scoreA] of scoresA) {
    const scoreB = scoresB.get(bookId);
    if (scoreB === undefined) continue;
    if (Math.abs(scoreA - scoreB) < DISAGREEMENT_THRESHOLD) {
      alignedBookIds.push(bookId);
    }
  }
  if (alignedBookIds.length === 0) return new Set();

  const data = assertNoSupabaseError(
    await supabase
      .from("books")
      .select("categories")
      .in("id", alignedBookIds)
      .returns<{ categories: string[] | null }[]>(),
    "fetching aligned-genre books",
  );

  const genres = new Set<string>();
  for (const row of data ?? []) {
    for (const category of row.categories ?? []) {
      genres.add(category);
    }
  }
  return genres;
}

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
  const [otherScores, viewerScores, libraryRowsResult] = await Promise.all([
    getBookScores(supabase, otherId),
    getBookScores(supabase, viewerId),
    supabase.from("user_books").select("book_id").eq("user_id", viewerId),
  ]);
  const libraryRows = assertNoSupabaseError(
    libraryRowsResult,
    "fetching viewer's library for recommendations",
  );

  const viewerLibrary = new Set([
    ...(libraryRows ?? []).map((row) => row.book_id as string),
    ...viewerScores.keys(),
  ]);

  const candidateIds = [...otherScores.keys()].filter(
    (bookId) => !viewerLibrary.has(bookId),
  );

  if (candidateIds.length === 0) return [];

  const viewerBookRows = assertNoSupabaseError(
    viewerLibrary.size > 0
      ? await supabase
          .from("books")
          .select("id, title")
          .in("id", [...viewerLibrary])
          .returns<{ id: string; title: string }[]>()
      : { data: [] as { id: string; title: string }[], error: null },
    "fetching viewer's book titles for dedup",
  );

  const viewerTitles = new Set(
    (viewerBookRows ?? []).map((book) => book.title.trim().toLowerCase()),
  );

  const [candidateBooksResult, alignedGenres] = await Promise.all([
    supabase
      .from("books")
      .select(
        "id, title, authors, thumbnail_url, categories, description, average_rating",
      )
      .in("id", candidateIds)
      .returns<RecommendationBookRow[]>(),
    getAlignedGenres(supabase, viewerScores, otherScores),
  ]);
  const candidateBooks = assertNoSupabaseError(
    candidateBooksResult,
    "fetching recommendation candidate books",
  );

  const sorted = (candidateBooks ?? [])
    .filter((book) => !viewerTitles.has(book.title.trim().toLowerCase()))
    .map((book) => ({ book, score: otherScores.get(book.id)! }))
    .sort((a, b) => b.score - a.score);

  // Scope to genres you two actually agree on — but never let that filter
  // empty the list outright (e.g. sparse/missing category data shouldn't
  // silently zero out recommendations that would otherwise be fine).
  if (alignedGenres.size === 0) return sorted;
  const genreMatched = sorted.filter(({ book }) =>
    (book.categories ?? []).some((category) => alignedGenres.has(category)),
  );
  return genreMatched.length > 0 ? genreMatched : sorted;
}

export type MatchRecommendation = {
  bookId: string;
  title: string;
  authors: string[] | null;
  thumbnail: string | null;
  matchPercentage: number;
  description: string | null;
  averageRating: number | null;
  // How the *other* person tiered this book — not used by the default
  // list-row rendering (RecommendationRow), but backs Compare detail's own
  // cover-strip variant, which shows a tier badge per cover the way
  // Shared Ranking does.
  theirTier: string;
};

// Only recommend books the other person rated highly enough to mean "they
// loved it" — matches the standalone Recommendations feature's own bar
// (lib/db/recommendations.ts's RECOMMENDATION_TIER_THRESHOLD), rather than
// just "whatever's left after excluding what the viewer already owns," which
// could be as low as their single C-tier book.
const RECOMMENDATION_TIER_THRESHOLD = TIER_SCORES.A;

// A real match (3+ shared books) isn't enough evidence to call a
// recommendation "strong" — the actual product goal is "10 books tiered
// mostly the same way, and this person's A/S books you haven't read are a
// strong pre-rec." 8 shared books is the bar for that: enough overlap that
// agreement across them means something, short of requiring the full 10.
// Only gates recommendations specifically — the 3-book minimum still
// governs whether a match percentage/summary panels show at all.
export const MIN_RECOMMENDATION_SHARED_BOOKS = 8;

// Recommendations need a real, above-baseline match, not just "some
// overlap" — chosen as the same "beats the ~61% random-chance baseline" bar
// top-matches.ts's own ranking uses, but kept as its own separate constant
// since this one specifically governs whether we suggest specific books off
// a match (a content-quality decision), not whether someone shows up in Top
// Matches at all — retuning one shouldn't silently retune the other.
export const MIN_RECOMMENDATION_MATCH_PERCENTAGE = 65;

// "Based on this match, you might like" — the other user's top N
// highest-rated (A-tier+) books the viewer doesn't have. Requires the
// caller to already know there's a real match *and* enough shared books to
// clear MIN_RECOMMENDATION_SHARED_BOOKS (see the compare detail page) —
// this function has no way to check either itself, since it never computes
// an overall match, only looks at one user's individual book scores.
//
// matchPercentage is the pair's real, already-computed taste-match
// percentage — the same number for every recommendation from this person.
// It used to be `score / TIER_SCORES.S` (how highly *they* personally
// rated that one book), which meant a "100% match" badge could show up
// on a recommendation from someone the viewer barely overlaps with at all;
// that number never had anything to do with the viewer.
export async function getMatchRecommendations(
  supabase: SupabaseServerClient,
  viewerId: string,
  otherId: string,
  matchPercentage: number,
  limit = 4,
): Promise<MatchRecommendation[]> {
  const candidates = await getRankedRecommendationCandidates(
    supabase,
    viewerId,
    otherId,
  );

  return candidates
    .filter(({ score }) => score >= RECOMMENDATION_TIER_THRESHOLD)
    .slice(0, limit)
    .map(({ book, score }) => ({
      bookId: book.id,
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail_url,
      matchPercentage,
      description: book.description,
      averageRating: book.average_rating,
      theirTier: scoreToTier(score),
    }));
}
