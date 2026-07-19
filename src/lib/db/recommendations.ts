import {
  computeMatch,
  getAlignedGenres,
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
  // Whoever's rating actually won the dedup for this book — null is a
  // legitimate case (see recommendation_outcomes' schema comment), not a
  // bug, since a book can in principle be picked without one exact
  // attribution surviving.
  sourceUserId: string | null;
  sharedBookCount: number;
  sourceBooksRanked: number;
  description: string | null;
  averageRating: number | null;
};

export type RecommendationsResult = {
  recommendations: BookRecommendation[];
  // The lowest match % among the users actually contributing recommendations
  // — true statement for a subtitle like "Based on users with X%+ similarity".
  usedThreshold: number | null;
  viewerBooksRanked: number;
};

type ProfileRow = { id: string };
type BookRow = {
  id: string;
  title: string;
  authors: string[] | null;
  thumbnail_url: string | null;
  description: string | null;
  average_rating: number | null;
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

  const candidates: {
    userId: string;
    percentage: number;
    sharedBookCount: number;
    scores: Map<string, number>;
  }[] = [];

  for (const profile of profiles ?? []) {
    const theirScores = await getBookScores(supabase, profile.id);
    const match = computeMatch(myScores, theirScores);
    if (match.percentage === null) continue;
    candidates.push({
      userId: profile.id,
      percentage: match.percentage,
      sharedBookCount: match.sharedBookCount,
      scores: theirScores,
    });
  }

  candidates.sort((a, b) => b.percentage - a.percentage);
  const pool = candidates.slice(0, CANDIDATE_POOL_SIZE);

  if (pool.length === 0) {
    return { recommendations: [], usedThreshold: null, viewerBooksRanked: myScores.size };
  }

  const usedThreshold = pool[pool.length - 1].percentage;

  // Scope each pool member's contribution to the genres you two actually
  // agree on (see getAlignedGenres) rather than their single highest-rated
  // book regardless of topic — someone can be a strong overall match built
  // mostly on shared fantasy picks while personally reading far more
  // thriller, and their thriller favorites aren't the pre-rec that match
  // was actually earned on.
  const candidateBookIds = new Set<string>();
  for (const candidate of pool) {
    for (const [bookId, score] of candidate.scores) {
      if (score < RECOMMENDATION_TIER_THRESHOLD) continue;
      if (myLibrary.has(bookId)) continue;
      candidateBookIds.add(bookId);
    }
  }

  const [alignedGenresByCandidate, { data: candidateCategoryRows }] =
    await Promise.all([
      Promise.all(
        pool.map((candidate) =>
          getAlignedGenres(supabase, myScores, candidate.scores),
        ),
      ),
      candidateBookIds.size > 0
        ? supabase
            .from("books")
            .select("id, categories")
            .in("id", [...candidateBookIds])
            .returns<{ id: string; categories: string[] | null }[]>()
        : Promise.resolve({
            data: [] as { id: string; categories: string[] | null }[],
          }),
    ]);

  const categoriesByBook = new Map(
    (candidateCategoryRows ?? []).map((row) => [row.id, row.categories ?? []]),
  );

  // Dedupe books recommended by multiple similar users, keeping the
  // highest match % among whoever rated it highly. Tracked twice — once
  // scoped to aligned genres, once not — so a sparse/missing category data
  // set can never silently zero out recommendations that would otherwise
  // be fine; the genre-scoped map is only used when it isn't empty.
  type BestEntry = {
    percentage: number;
    sourceUserId: string;
    sharedBookCount: number;
    sourceBooksRanked: number;
  };
  const bestByBookFiltered = new Map<string, BestEntry>();
  const bestByBookAll = new Map<string, BestEntry>();

  pool.forEach((candidate, i) => {
    const alignedGenres = alignedGenresByCandidate[i];
    for (const [bookId, score] of candidate.scores) {
      if (score < RECOMMENDATION_TIER_THRESHOLD) continue;
      if (myLibrary.has(bookId)) continue;

      const entry: BestEntry = {
        percentage: candidate.percentage,
        sourceUserId: candidate.userId,
        sharedBookCount: candidate.sharedBookCount,
        sourceBooksRanked: candidate.scores.size,
      };

      const existingAll = bestByBookAll.get(bookId);
      if (!existingAll || candidate.percentage > existingAll.percentage) {
        bestByBookAll.set(bookId, entry);
      }

      const bookGenres = categoriesByBook.get(bookId) ?? [];
      const passesGenre =
        alignedGenres.size === 0 ||
        bookGenres.some((genre) => alignedGenres.has(genre));
      if (passesGenre) {
        const existingFiltered = bestByBookFiltered.get(bookId);
        if (
          !existingFiltered ||
          candidate.percentage > existingFiltered.percentage
        ) {
          bestByBookFiltered.set(bookId, entry);
        }
      }
    }
  });

  const bestByBook =
    bestByBookFiltered.size > 0 ? bestByBookFiltered : bestByBookAll;

  const bookIds = [...bestByBook.keys()];
  if (bookIds.length === 0) {
    return { recommendations: [], usedThreshold, viewerBooksRanked: myScores.size };
  }

  const { data: books } = await supabase
    .from("books")
    .select("id, title, authors, thumbnail_url, description, average_rating")
    .in("id", bookIds)
    .returns<BookRow[]>();

  const recommendations: BookRecommendation[] = (books ?? [])
    .filter((book) => !myTitles.has(book.title.trim().toLowerCase()))
    .map((book) => {
      const best = bestByBook.get(book.id)!;
      return {
        bookId: book.id,
        title: book.title,
        authors: book.authors,
        thumbnail: book.thumbnail_url,
        matchPercentage: best.percentage,
        sourceUserId: best.sourceUserId,
        sharedBookCount: best.sharedBookCount,
        sourceBooksRanked: best.sourceBooksRanked,
        description: book.description,
        averageRating: book.average_rating,
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, limit);

  return { recommendations, usedThreshold, viewerBooksRanked: myScores.size };
}
