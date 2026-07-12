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
      booksRankedCount: theirScores.size,
      topGenres,
      topFavorites,
    });
  }

  const sorted = results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return limit ? sorted.slice(0, limit) : sorted;
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

async function getTopGenres(
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
