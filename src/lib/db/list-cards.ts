import type { createClient } from "@/lib/supabase/server";
import type { Tier } from "@/lib/tiers";
import { computeMatch, getBookScores } from "@/lib/db/taste-match";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PreviewBook = { id: string; title: string; thumbnail: string | null };

export type ListCardData = {
  id: string;
  title: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  matchPercentage: number | null;
  isPublic: boolean;
  isDraft: boolean;
  preview: Record<Tier, PreviewBook[]>;
};

type TierListRow = {
  id: string;
  title: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  is_public: boolean;
  is_draft: boolean;
};

type ItemRow = {
  tier_list_id: string;
  tier: Tier;
  books: { id: string; title: string; thumbnail_url: string | null };
};

export async function getUserListCards(
  supabase: SupabaseServerClient,
  userId: string,
  { publicOnly = false, viewerId }: { publicOnly?: boolean; viewerId?: string } = {},
): Promise<ListCardData[]> {
  let query = supabase
    .from("tier_lists")
    .select("id, title, like_count, comment_count, created_at, is_public, is_draft")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // A visitor (publicOnly) never sees another user's drafts — only the
  // owner's own profile call (no publicOnly) is meant to surface them, so
  // they have somewhere to resume an unpublished list from instead of it
  // being unreachable the moment they navigate away.
  if (publicOnly) {
    query = query.eq("is_public", true).eq("is_draft", false);
  }

  // A single match % for the (viewer, list owner) pair — same for every
  // list of theirs, since match % isn't a per-list property.
  const matchPercentage: number | null =
    viewerId && viewerId !== userId
      ? computeMatch(
          await getBookScores(supabase, viewerId),
          await getBookScores(supabase, userId),
        ).percentage
      : null;

  const { data: tierLists } = await query.returns<TierListRow[]>();
  const lists = tierLists ?? [];
  const listIds = lists.map((list) => list.id);

  const { data: items } =
    listIds.length > 0
      ? await supabase
          .from("tier_list_items")
          .select("tier_list_id, tier, books(id, title, thumbnail_url)")
          .in("tier_list_id", listIds)
          .order("position", { ascending: true })
          .returns<ItemRow[]>()
      : { data: [] as ItemRow[] };

  const previewByListId: Record<string, ListCardData["preview"]> = {};
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

  return lists.map((list) => ({
    id: list.id,
    title: list.title,
    createdAt: list.created_at,
    likeCount: list.like_count,
    commentCount: list.comment_count,
    matchPercentage,
    isPublic: list.is_public,
    isDraft: list.is_draft,
    preview: previewByListId[list.id],
  }));
}
