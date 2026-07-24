import {
  computeMatch,
  getBookScores,
  TIER_SCORES,
  type SupabaseServerClient,
} from "@/lib/db/taste-match";
import { assertNoSupabaseError } from "@/lib/supabase/assert";
import { shortenGenre } from "@/lib/genre-labels";

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
  // How many of their S/A-tier books aren't already in the viewer's
  // library — surfaced on the card as "N of their favorites you haven't
  // read." 0 when includeDetails is false.
  discoveryCount: number;
  // Their top 3 most-ranked categories — reintroduced for the redesigned
  // Top Matches list's genre-tag pills (design2/"compare final.png").
  // Removed earlier this session for being filler unrelated to the viewer;
  // brought back once the card actually had a spot for it that wasn't
  // "just decoration." Empty when includeDetails is false.
  topGenres: string[];
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};
type ListRow = { id: string; user_id: string };
type ItemRow = {
  tier_list_id: string;
  tier: string;
  book_id: string;
  books: { categories: string[] | null } | null;
};

const TOP_GENRES_LIMIT = 3;

// Powers both the Compare landing page's "All" tab (every user with a
// computable match) and "Friends" tab (same ranking, restricted to people
// the viewer follows) — same "person you might vibe with" idea either way,
// just a different candidate pool. Also powers the Explore sidebar rail
// (`includeDetails: false, limit: N`).
//
// Batch-fetches every candidate's tier_lists and tier_list_items in 2
// queries total (plus one more for the viewer's own library, only when
// includeDetails needs discoveryCount), then computes match percentages,
// discoveryCount, and agreedCount entirely in memory — a fixed handful of
// queries regardless of candidate count.
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
    const follows = assertNoSupabaseError(
      await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId),
      "fetching follows for top matches",
    );
    candidateIds = (follows ?? []).map((row) => row.following_id as string);
  } else {
    const profiles = assertNoSupabaseError(
      await supabase.from("profiles").select("id").neq("id", viewerId),
      "fetching candidate profiles for top matches",
    );
    candidateIds = (profiles ?? []).map((row) => row.id as string);
  }

  if (candidateIds.length === 0) return [];

  const profileRows = assertNoSupabaseError(
    await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", candidateIds)
      .returns<ProfileRow[]>(),
    "fetching top match profiles",
  );

  if (!profileRows || profileRows.length === 0) return [];

  const listRows = assertNoSupabaseError(
    await supabase
      .from("tier_lists")
      .select("id, user_id")
      .in(
        "user_id",
        profileRows.map((p) => p.id),
      )
      .returns<ListRow[]>(),
    "fetching top match candidates' lists",
  );

  const listIdToUserId = new Map((listRows ?? []).map((l) => [l.id, l.user_id]));
  const allListIds = [...listIdToUserId.keys()];

  const itemsByUser = new Map<string, ItemRow[]>();
  if (allListIds.length > 0) {
    // categories are only ever read when includeDetails needs topGenres —
    // the join is skipped entirely for the Explore rail's
    // `includeDetails: false` call, keeping that path as light as before.
    const itemsSelect = includeDetails
      ? "tier_list_id, tier, book_id, books(categories)"
      : "tier_list_id, tier, book_id";
    const itemRows = assertNoSupabaseError(
      await supabase
        .from("tier_list_items")
        .select(itemsSelect)
        .in("tier_list_id", allListIds)
        .returns<ItemRow[]>(),
      "fetching top match candidates' ranked items",
    );

    for (const item of itemRows ?? []) {
      const userId = listIdToUserId.get(item.tier_list_id);
      if (!userId) continue;
      const list = itemsByUser.get(userId);
      if (list) list.push(item);
      else itemsByUser.set(userId, [item]);
    }
  }

  // Only fetched when includeDetails is set — discoveryCount is the one
  // piece of per-candidate data that needs to know what the *viewer*
  // already owns, not just the candidate's own ranked items. Skipped
  // entirely for the Explore rail's `includeDetails: false` call, which
  // doesn't render it.
  let viewerLibrary: Set<string> | null = null;
  if (includeDetails) {
    const libraryRows = assertNoSupabaseError(
      await supabase
        .from("user_books")
        .select("book_id")
        .eq("user_id", viewerId),
      "fetching viewer's library for top match discovery counts",
    );
    viewerLibrary = new Set([
      ...(libraryRows ?? []).map((row) => row.book_id as string),
      ...viewerScores.keys(),
    ]);
  }

  const results: TopMatchPerson[] = [];

  for (const profile of profileRows) {
    const items = itemsByUser.get(profile.id) ?? [];
    const rankedItems = items.filter((item) => item.tier !== "unranked");

    // Same per-book averaging getBookScores does, just off the
    // already-fetched batch instead of its own query.
    const scoreSums = new Map<string, { sum: number; count: number }>();
    for (const item of rankedItems) {
      const score = TIER_SCORES[item.tier];
      if (!score) continue;
      const entry = scoreSums.get(item.book_id) ?? { sum: 0, count: 0 };
      entry.sum += score;
      entry.count += 1;
      scoreSums.set(item.book_id, entry);
    }
    const theirScores = new Map<string, number>();
    for (const [bookId, { sum, count }] of scoreSums) {
      theirScores.set(bookId, sum / count);
    }

    const match = computeMatch(viewerScores, theirScores);
    if (match.percentage === null) continue;

    let discoveryCount = 0;
    let topGenres: string[] = [];

    if (includeDetails && viewerLibrary) {
      const favoriteBookIds = new Set<string>();
      for (const item of rankedItems) {
        if (item.tier === "S" || item.tier === "A") {
          favoriteBookIds.add(item.book_id);
        }
      }
      for (const bookId of favoriteBookIds) {
        if (!viewerLibrary.has(bookId)) discoveryCount += 1;
      }

      // Normalize before tallying (not after) so equivalent catalog forms —
      // e.g. "Science Fiction" and "Hard Science Fiction" — merge into one
      // "Sci-Fi" count instead of splitting it across near-duplicate raw
      // strings. shortenGenre is an allowlist (see genre-labels.ts): most of
      // the real catalog's ~99 distinct category strings are Open Library
      // topical/setting tags ("Schools In Fiction", "Washington (State) --
      // Fiction"), not real genres, and a plain length cap can't tell those
      // apart from genuine short genres — so anything unmapped is dropped
      // outright, not just truncated.
      const genreTally = new Map<string, number>();
      for (const item of rankedItems) {
        for (const category of item.books?.categories ?? []) {
          const label = shortenGenre(category);
          if (!label) continue;
          genreTally.set(label, (genreTally.get(label) ?? 0) + 1);
        }
      }
      topGenres = [...genreTally.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_GENRES_LIMIT)
        .map(([label]) => label);
    }

    results.push({
      userId: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      matchPercentage: match.percentage,
      sharedBookCount: match.sharedBookCount,
      booksRankedCount: theirScores.size,
      discoveryCount,
      topGenres,
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
// computeMatch's tier-gap formula — used here as the "no real evidence"
// baseline that a thin match gets pulled toward.
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

// The Top Matches list shows a flat 10 at a time by default, expanding to a
// flat 15 (never the true full list) via "View more" (compare/page.tsx) —
// no separate "backfill if thin" quality bar needed here; sortedMatches is
// already ranked best-first, so a flat slice already shows the best N
// regardless of how many clear any particular quality bar.
export const DEFAULT_DISPLAY_COUNT = 10;
export const EXPANDED_DISPLAY_COUNT = 15;

// Curates an already-sorted (desc) match list for actual display: the top
// DEFAULT_DISPLAY_COUNT, or EXPANDED_DISPLAY_COUNT once "View more" has been
// clicked. Deliberately separate from getTopMatches itself — callers that
// need the *true* full count (e.g. the "you match with N% of users"
// coverage stat) should keep using the raw list, not this curated view.
export function curateTopMatches(
  sortedMatches: TopMatchPerson[],
  { expanded = false }: { expanded?: boolean } = {},
): TopMatchPerson[] {
  return sortedMatches.slice(0, expanded ? EXPANDED_DISPLAY_COUNT : DEFAULT_DISPLAY_COUNT);
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
