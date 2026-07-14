import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExploreListCard } from "@/components/explore/list-card";
import { SegmentedTabs } from "@/components/segmented-tabs";
import { TopMatchesRail } from "@/components/top-matches-rail";
import { computeMatch, getBookScores } from "@/lib/db/taste-match";
import type { Tier } from "@/lib/tiers";

type ExploreTab = "for-you" | "following";
type ExploreSort = "popular" | "recent";

type TierListRow = {
  id: string;
  title: string;
  user_id: string;
  like_count: number;
  comment_count: number;
  created_at: string;
};

type ItemRow = {
  tier_list_id: string;
  tier: Tier;
  position: number;
  books: { id: string; title: string; thumbnail_url: string | null };
};

type ProfileRow = { id: string; username: string; avatar_url: string | null };

type PreviewMap = Record<
  string,
  Record<Tier, { id: string; title: string; thumbnail: string | null }[]>
>;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sort?: string }>;
}) {
  const { tab: rawTab, sort: rawSort } = await searchParams;
  const tab: ExploreTab = rawTab === "following" ? "following" : "for-you";
  const sort: ExploreSort = rawSort === "recent" ? "recent" : "popular";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let listsQuery = supabase
    .from("tier_lists")
    .select("id, title, user_id, like_count, comment_count, created_at")
    .eq("is_public", true)
    .limit(20);

  if (tab === "following") {
    const followingIds = user
      ? ((
          await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
        ).data?.map((row) => row.following_id as string) ?? [])
      : [];

    // No one followed yet (or logged out) — show nothing rather than
    // silently falling back to the unfiltered feed.
    listsQuery = listsQuery.in(
      "user_id",
      followingIds.length > 0
        ? followingIds
        : ["00000000-0000-0000-0000-000000000000"],
    );
  }

  // "Popular" is a placeholder until real taste-match scoring exists
  // (Sprint 5) — for now it sorts by like count. "Recent" sorts by
  // updated_at (bumped by the tier_list_items trigger — see migration 0024
  // — whenever a book is ranked/moved/removed, not just list creation), so
  // it actually reflects "last edited," not just "first created". Both
  // branches add a final `id` tiebreaker so ties (e.g. everything at
  // like_count 0 in a fresh dataset) return in a stable, deterministic order
  // instead of shuffling between requests.
  listsQuery =
    sort === "recent"
      ? listsQuery.order("updated_at", { ascending: false }).order("id")
      : listsQuery
          .order("like_count", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id");

  const { data: tierLists } = await listsQuery.returns<TierListRow[]>();

  const lists = tierLists ?? [];
  const listIds = lists.map((list) => list.id);
  const userIds = [...new Set(lists.map((list) => list.user_id))];

  const [{ data: items }, { data: profiles }] = await Promise.all([
    listIds.length > 0
      ? supabase
          .from("tier_list_items")
          .select(
            "tier_list_id, tier, position, books(id, title, thumbnail_url)",
          )
          .in("tier_list_id", listIds)
          .order("position", { ascending: true })
          .returns<ItemRow[]>()
      : Promise.resolve({ data: [] as ItemRow[] }),
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds)
          .returns<ProfileRow[]>()
      : Promise.resolve({ data: [] as ProfileRow[] }),
  ]);

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  // Match % against each unique list creator (skipping yourself), computed
  // once per creator and reused across all of their cards in the feed.
  const matchByUserId = new Map<string, number | null>();
  if (user) {
    const viewerScores = await getBookScores(supabase, user.id);
    for (const creatorId of userIds) {
      if (creatorId === user.id) {
        matchByUserId.set(creatorId, null);
        continue;
      }
      const creatorScores = await getBookScores(supabase, creatorId);
      const match = computeMatch(viewerScores, creatorScores);
      matchByUserId.set(creatorId, match.percentage);
    }
  }

  const previewByListId: PreviewMap = {};
  for (const list of lists) {
    previewByListId[list.id] = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      F: [],
      unranked: [],
    };
  }

  for (const item of items ?? []) {
    const preview = previewByListId[item.tier_list_id];
    if (!preview) continue;
    preview[item.tier].push({
      id: item.books.id,
      title: item.books.title,
      thumbnail: item.books.thumbnail_url,
    });
  }

  return (
    <div className="flex w-full flex-1 gap-6 p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 lg:max-w-3xl xl:max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground lg:text-3xl">
            Explore
          </h1>
          <Link
            href="/recommendations"
            className="text-sm font-medium text-primary lg:text-base"
          >
            Recommendations
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2">
          <SegmentedTabs
            basePath="/explore"
            tabs={[
              { value: "for-you", label: "For You" },
              { value: "following", label: "Following" },
            ]}
            current={tab}
          />

          {tab === "for-you" && (
            <SegmentedTabs
              basePath="/explore"
              paramName="sort"
              extraParams={{ tab: "for-you" }}
              tabs={[
                { value: "popular", label: "Popular" },
                { value: "recent", label: "Recent" },
              ]}
              current={sort}
            />
          )}
        </div>

        {lists.length === 0 ? (
          <p className="text-muted-foreground">
            No public tier lists yet — be the first to make one public!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {lists.map((list) => (
              <ExploreListCard
                key={list.id}
                id={list.id}
                title={list.title}
                username={
                  profileByUserId.get(list.user_id)?.username ?? "unknown"
                }
                avatarUrl={profileByUserId.get(list.user_id)?.avatar_url}
                createdAt={list.created_at}
                likeCount={list.like_count}
                commentCount={list.comment_count}
                matchPercentage={matchByUserId.get(list.user_id)}
                preview={previewByListId[list.id]}
                fromTab="explore"
              />
            ))}
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <TopMatchesRail />
      </Suspense>
    </div>
  );
}
