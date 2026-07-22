import { scoreToTier, type SupabaseServerClient } from "@/lib/db/taste-match";
import { assertNoSupabaseError } from "@/lib/supabase/assert";

export type RecommendationSource =
  | "compare_detail"
  | "standalone"
  | "profile_rail";

export type RecommendationImpression = {
  viewerUserId: string;
  sourceUserId: string | null;
  bookId: string;
  source: RecommendationSource;
  matchPercentage: number;
  sharedBookCount: number;
  viewerBooksRanked: number;
  sourceBooksRanked: number;
  sharedFavoritesCount?: number;
  sharedDislikesCount?: number;
  disagreementsCount?: number;
};

// Best-effort logging for the recommendation_outcomes event log — never
// throws, since a broken analytics write should never break the page
// that's rendering real recommendations to a real user. One row per
// (viewer, book, surface): re-showing the same recommendation on the same
// surface refreshes the snapshot fields via upsert rather than piling up
// duplicate impressions, but never touches `clicked`/`viewer_final_tier`
// (those columns are simply absent from this payload, so Postgres leaves
// them alone on conflict) — an outcome already collected must never be
// silently overwritten just because the recommendation was shown again.
export async function recordRecommendationImpressions(
  supabase: SupabaseServerClient,
  impressions: RecommendationImpression[],
): Promise<void> {
  if (impressions.length === 0) return;

  const rows = impressions.map((impression) => ({
    viewer_user_id: impression.viewerUserId,
    source_user_id: impression.sourceUserId,
    recommended_book_id: impression.bookId,
    recommendation_source: impression.source,
    viewer_match_percentage: impression.matchPercentage,
    shared_book_count: impression.sharedBookCount,
    viewer_books_ranked: impression.viewerBooksRanked,
    source_books_ranked: impression.sourceBooksRanked,
    shared_favorites_count: impression.sharedFavoritesCount ?? null,
    shared_dislikes_count: impression.sharedDislikesCount ?? null,
    disagreements_count: impression.disagreementsCount ?? null,
    last_recommended_at: new Date().toISOString(),
  }));

  try {
    await supabase.from("recommendation_outcomes").upsert(rows, {
      onConflict: "viewer_user_id,recommended_book_id,recommendation_source",
    });
  } catch {
    // Swallow — see comment above.
  }
}

// Fired from the "Add" button's server action. Scoped to the exact
// (viewer, book, surface) triple the click actually happened on, so
// clicking a recommendation shown twice (e.g. once on Compare, once on the
// standalone page) only marks the surface it was actually clicked from.
export async function markRecommendationClicked(
  supabase: SupabaseServerClient,
  viewerUserId: string,
  bookId: string,
  source: RecommendationSource,
): Promise<void> {
  try {
    await supabase
      .from("recommendation_outcomes")
      .update({ clicked: true, clicked_at: new Date().toISOString() })
      .eq("viewer_user_id", viewerUserId)
      .eq("recommended_book_id", bookId)
      .eq("recommendation_source", source);
  } catch {
    // Swallow — see recordRecommendationImpressions.
  }
}

// Fired when a recommendation row's book-detail drawer is actually opened —
// the real middle funnel stage between "shown" and "added" that didn't
// exist before RecommendationRow started using BookDetailDrawer. Same
// exact-surface scoping as markRecommendationClicked.
export async function markRecommendationOpened(
  supabase: SupabaseServerClient,
  viewerUserId: string,
  bookId: string,
  source: RecommendationSource,
): Promise<void> {
  try {
    await supabase
      .from("recommendation_outcomes")
      .update({ opened_book_page: true, opened_at: new Date().toISOString() })
      .eq("viewer_user_id", viewerUserId)
      .eq("recommended_book_id", bookId)
      .eq("recommendation_source", source);
  } catch {
    // Swallow — see recordRecommendationImpressions.
  }
}

export type OutcomesReportRow = {
  matchRangeLabel: string;
  sharedRangeLabel: string;
  recommendations: number;
  read: number;
  avgFinalTier: string | null;
  saRate: number | null;
};

type OutcomeRow = {
  viewer_match_percentage: number | null;
  shared_book_count: number | null;
  viewer_final_tier: string | null;
  viewer_final_score: number | null;
};

// Fixed, hand-picked buckets rather than dynamic quartiles — small early
// dataset, and fixed ranges make the report comparable run over run as data
// accumulates. Retune once real volume exists to see whether these are the
// right cut points.
const BUCKETS: {
  matchMin: number;
  matchMax: number;
  sharedMin: number;
  sharedMax: number;
  matchRangeLabel: string;
  sharedRangeLabel: string;
}[] = [
  {
    matchMin: 65,
    matchMax: 70,
    sharedMin: 8,
    sharedMax: 12,
    matchRangeLabel: "65-70",
    sharedRangeLabel: "8-12",
  },
  {
    matchMin: 70,
    matchMax: 80,
    sharedMin: 13,
    sharedMax: 20,
    matchRangeLabel: "70-80",
    sharedRangeLabel: "13-20",
  },
  {
    matchMin: 80,
    matchMax: 90,
    sharedMin: 21,
    sharedMax: 40,
    matchRangeLabel: "80-90",
    sharedRangeLabel: "21-40",
  },
  {
    matchMin: 90,
    matchMax: 101,
    sharedMin: 41,
    sharedMax: Infinity,
    matchRangeLabel: "90-100",
    sharedRangeLabel: "40+",
  },
];

// Admin-only report: for each match%/shared-books bucket, how many
// recommendations were shown, how many the viewer eventually ranked ("Read"
// — this app has no reading-status tracking, so "ranked it" is the closest
// real signal to "actually engaged with it"), their average final tier, and
// what fraction landed S/A. This is the whole point of the event log above
// — real evidence for whether a higher match %/shared-book-count pairing
// actually produces recommendations people end up loving, before investing
// more in the matching algorithm itself (see the backlogged V2 per-genre-
// cluster matching idea).
export async function getRecommendationOutcomesReport(
  supabase: SupabaseServerClient,
): Promise<OutcomesReportRow[]> {
  const data = assertNoSupabaseError(
    await supabase
      .from("recommendation_outcomes")
      .select(
        "viewer_match_percentage, shared_book_count, viewer_final_tier, viewer_final_score",
      )
      .returns<OutcomeRow[]>(),
    "fetching recommendation outcomes report",
  );

  const rows = data ?? [];

  return BUCKETS.map((bucket) => {
    const inBucket = rows.filter(
      (row) =>
        row.viewer_match_percentage !== null &&
        row.shared_book_count !== null &&
        row.viewer_match_percentage >= bucket.matchMin &&
        row.viewer_match_percentage < bucket.matchMax &&
        row.shared_book_count >= bucket.sharedMin &&
        row.shared_book_count <= bucket.sharedMax,
    );
    const read = inBucket.filter((row) => row.viewer_final_tier !== null);
    const avgScore =
      read.length > 0
        ? read.reduce((sum, row) => sum + (row.viewer_final_score ?? 0), 0) /
          read.length
        : null;
    const saCount = read.filter(
      (row) => row.viewer_final_tier === "S" || row.viewer_final_tier === "A",
    ).length;

    return {
      matchRangeLabel: bucket.matchRangeLabel,
      sharedRangeLabel: bucket.sharedRangeLabel,
      recommendations: inBucket.length,
      read: read.length,
      avgFinalTier: avgScore !== null ? scoreToTier(Math.round(avgScore)) : null,
      saRate:
        read.length > 0 ? Math.round((saCount / read.length) * 100) : null,
    };
  });
}
