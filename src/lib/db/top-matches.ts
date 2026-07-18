import {
  computeMatch,
  getBookScores,
  type SupabaseServerClient,
} from "@/lib/db/taste-match";
import { getFavoriteBooks, type FavoriteBook } from "@/lib/db/favorites";

export type TopMatchPerson = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  matchPercentage: number;
  // How many books this percentage is actually built on — a 96% match on
  // 20 shared books and a 90% match on 3 are different-strength signals,
  // but the UI couldn't tell them apart before this existed (see the
  // Compare logic audit). Always available regardless of `includeDetails`
  // since computeMatch already returns it as a side effect of the
  // percentage itself — no extra query.
  sharedBookCount: number;
  booksRankedCount: number;
  topGenres: string[];
  topFavorites: FavoriteBook[];
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};
type CategoryRow = { books: { categories: string[] | null } };

const TOP_GENRES_LIMIT = 3;
const TOP_FAVORITES_LIMIT = 3;

// Powers both the Compare landing page's "All" tab (every user with a
// computable match) and "Friends" tab (same ranking, restricted to people
// the viewer follows) — same "person you might vibe with" idea either way,
// just a different candidate pool. Also powers the Explore sidebar rail
// (`includeDetails: false, limit: N`) — that's a compact avatar/name/match%
// preview with no genres/favorites shown, so it skips those two extra
// per-candidate queries entirely rather than fetching data nothing renders.
// `limit` only slices the final sorted list — every candidate still has to
// be matched first to know who ranks in the top N.
export async function getTopMatches(
  supabase: SupabaseServerClient,
  viewerId: string,
  {
    followingOnly = false,
    includeDetails = true,
    limit,
  }: {
    followingOnly?: boolean;
    includeDetails?: boolean;
    limit?: number;
  } = {},
): Promise<TopMatchPerson[]> {
  const viewerScores = await getBookScores(supabase, viewerId);

  let candidateIds: string[];

  if (followingOnly) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId);
    candidateIds = (follows ?? []).map((row) => row.following_id as string);
  } else {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .neq("id", viewerId);
    candidateIds = (profiles ?? []).map((row) => row.id as string);
  }

  if (candidateIds.length === 0) return [];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", candidateIds)
    .returns<ProfileRow[]>();

  const results: TopMatchPerson[] = [];

  for (const profile of profileRows ?? []) {
    const theirScores = await getBookScores(supabase, profile.id);
    const match = computeMatch(viewerScores, theirScores);
    if (match.percentage === null) continue;

    const [topGenres, topFavorites] = includeDetails
      ? await Promise.all([
          getTopGenres(supabase, profile.id),
          getFavoriteBooks(supabase, profile.id, TOP_FAVORITES_LIMIT),
        ])
      : [[], []];

    results.push({
      userId: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      matchPercentage: match.percentage,
      sharedBookCount: match.sharedBookCount,
      booksRankedCount: theirScores.size,
      topGenres,
      topFavorites,
    });
  }

  const sorted = results.sort(
    (a, b) =>
      weightedRankScore(b.matchPercentage, b.sharedBookCount) -
      weightedRankScore(a.matchPercentage, a.sharedBookCount),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

// Two people with completely uncorrelated taste still average ~61% under
// computeMatch's tier-gap formula (see PREFERRED_MATCH_THRESHOLD below) —
// used here as the "no real evidence" baseline that a thin match gets
// pulled toward.
const RANDOM_BASELINE_PERCENTAGE = 61;

// How many shared books it takes to trust a match's raw percentage at face
// value — below this, the percentage gets shrunk toward the random
// baseline proportionally to how little evidence backs it. Standard
// "weighted rating" formula (the same shape IMDB uses for its own ranked
// list): at exactly this many shared books, a match is weighted 50/50
// between its own percentage and the baseline; more shared books trusts the
// real percentage more, fewer trusts it less. This is what actually makes
// "95% match on 3 books" rank below "90% match on 20 books" — the raw
// percentage alone never would, no matter how the display or the curation
// floor were tuned, since neither of those touch *ordering*.
const RANKING_CONFIDENCE_CONSTANT = 8;

function weightedRankScore(
  matchPercentage: number,
  sharedBookCount: number,
): number {
  const v = sharedBookCount;
  const m = RANKING_CONFIDENCE_CONSTANT;
  return (
    (v / (v + m)) * matchPercentage + (m / (v + m)) * RANDOM_BASELINE_PERCENTAGE
  );
}

// Below this, a match isn't a real signal — computeMatch's tier-gap formula
// means two people with completely uncorrelated taste still average ~61%
// (tiers are usually only 1-2 apart out of a possible 5 even at random), so
// anything meaningfully below that is actively worse than chance, not just
// a weak match.
const PREFERRED_MATCH_THRESHOLD = 65;

// If fewer than this many clear the preferred threshold, backfill with the
// next-best matches anyway so a small user base doesn't leave the list
// empty or sparse — same prefer-high-quality/fall-back-rather-than-show-
// nothing pattern the standalone Recommendations feature already uses for
// its own candidate pool (lib/db/recommendations.ts's CANDIDATE_POOL_SIZE).
const MIN_DISPLAY_COUNT = 5;

// Curates an already-sorted (desc) match list for actual display: everyone
// at/above PREFERRED_MATCH_THRESHOLD, or the top MIN_DISPLAY_COUNT overall
// if fewer than that many clear the bar. Deliberately separate from
// getTopMatches itself — callers that need the *true* full count (e.g. the
// "you match with N% of users" coverage stat) should keep using the raw
// list, not this curated view.
export function curateTopMatches(
  sortedMatches: TopMatchPerson[],
): TopMatchPerson[] {
  const strongCount = sortedMatches.filter(
    (person) => person.matchPercentage >= PREFERRED_MATCH_THRESHOLD,
  ).length;
  return sortedMatches.slice(0, Math.max(strongCount, MIN_DISPLAY_COUNT));
}

// Every other profile that exists, regardless of whether a match is
// computable — the denominator for "you match with N% of users on Tiera".
export async function getOtherUserCount(
  supabase: SupabaseServerClient,
  viewerId: string,
): Promise<number> {
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .neq("id", viewerId);
  return count ?? 0;
}

export async function getTopGenres(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string[]> {
  const { data: myLists } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("user_id", userId);

  const listIds = (myLists ?? []).map((list) => list.id);
  if (listIds.length === 0) return [];

  const { data: items } = await supabase
    .from("tier_list_items")
    .select("books(categories)")
    .in("tier_list_id", listIds)
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
    .slice(0, TOP_GENRES_LIMIT)
    .map(([category]) => category);
}
