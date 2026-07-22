import type { createClient } from "@/lib/supabase/server";
import type { Tier } from "@/lib/tiers";
import { computeMatch, getBookScores } from "@/lib/db/taste-match";
import { assertNoSupabaseError, logSupabaseError } from "@/lib/supabase/assert";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const ABANDONED_DRAFT_GRACE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIST_TITLE = "My Tier List";

type DraftCandidateRow = { id: string };

// Visiting /lists eagerly creates a blank draft row immediately, before any
// title/books/Save — the in-app "abandon this draft" cleanup
// (discardUnsavedDraft) only runs on an actual NavBar/Cancel click, so
// closing the tab, hitting back, or navigating by URL leaves an orphaned
// row behind forever. This sweeps ones old enough (24h) that it's clearly
// not just an in-progress session, and untouched enough (still the default
// title, no description/tags, zero books ever added) that it can only be a
// truly-abandoned blank — a real in-progress "Save Draft" always has a real
// title and/or at least one book, so this can never delete one of those.
// Called opportunistically from Profile's own Lists tab load rather than a
// scheduled job — no new infrastructure, and it only ever touches the
// signed-in user's own rows (same DELETE policy Cancel already uses).
export async function cleanupAbandonedDrafts(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<void> {
  const cutoff = new Date(Date.now() - ABANDONED_DRAFT_GRACE_MS).toISOString();

  // Opportunistic housekeeping, not core page content — a failure here
  // shouldn't stop the profile page from loading, just skip this sweep.
  const candidates = logSupabaseError(
    await supabase
      .from("tier_lists")
      .select("id")
      .eq("user_id", userId)
      .eq("is_draft", true)
      .eq("title", DEFAULT_LIST_TITLE)
      .is("description", null)
      .is("tags", null)
      .lt("created_at", cutoff)
      .returns<DraftCandidateRow[]>(),
    "fetching abandoned draft candidates",
    [],
  );

  const candidateIds = (candidates ?? []).map((row) => row.id);
  if (candidateIds.length === 0) return;

  const itemRows = logSupabaseError(
    await supabase
      .from("tier_list_items")
      .select("tier_list_id")
      .in("tier_list_id", candidateIds),
    "fetching items for abandoned draft check",
    [],
  );

  const idsWithItems = new Set(
    (itemRows ?? []).map((row) => row.tier_list_id as string),
  );
  const emptyIds = candidateIds.filter((id) => !idsWithItems.has(id));

  if (emptyIds.length === 0) return;

  await supabase.from("tier_lists").delete().in("id", emptyIds);
}

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
  // list of theirs, since match % isn't a per-list property. The two
  // getBookScores calls are independent, so run them concurrently rather
  // than sequentially.
  const matchPercentage: number | null =
    viewerId && viewerId !== userId
      ? computeMatch(
          ...(await Promise.all([
            getBookScores(supabase, viewerId),
            getBookScores(supabase, userId),
          ])),
        ).percentage
      : null;

  const tierLists = assertNoSupabaseError(
    await query.returns<TierListRow[]>(),
    "fetching list cards",
  );
  const lists = tierLists ?? [];
  const listIds = lists.map((list) => list.id);

  const items = assertNoSupabaseError(
    listIds.length > 0
      ? await supabase
          .from("tier_list_items")
          .select("tier_list_id, tier, books(id, title, thumbnail_url)")
          .in("tier_list_id", listIds)
          .order("position", { ascending: true })
          .returns<ItemRow[]>()
      : { data: [] as ItemRow[], error: null },
    "fetching list card items",
  );

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
