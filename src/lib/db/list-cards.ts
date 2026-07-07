import type { createClient } from "@/lib/supabase/server";
import type { Tier } from "@/lib/tiers";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PreviewBook = { id: string; title: string; thumbnail: string | null };

export type ListCardData = {
  id: string;
  title: string;
  likeCount: number;
  commentCount: number;
  preview: Record<Tier, PreviewBook[]>;
};

type TierListRow = {
  id: string;
  title: string;
  like_count: number;
  comment_count: number;
};

type ItemRow = {
  tier_list_id: string;
  tier: Tier;
  books: { id: string; title: string; thumbnail_url: string | null };
};

export async function getUserListCards(
  supabase: SupabaseServerClient,
  userId: string,
  { publicOnly = false }: { publicOnly?: boolean } = {},
): Promise<ListCardData[]> {
  let query = supabase
    .from("tier_lists")
    .select("id, title, like_count, comment_count")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (publicOnly) {
    query = query.eq("is_public", true);
  }

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
    likeCount: list.like_count,
    commentCount: list.comment_count,
    preview: previewByListId[list.id],
  }));
}
