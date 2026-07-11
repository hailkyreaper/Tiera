import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeMatch, getBookScores } from "@/lib/db/taste-match";
import { StandaloneTierBoard } from "@/components/tier-list/standalone-tier-board";
import type { DetailedColumns } from "@/components/tier-list/read-only-board";
import { CommentsSection, type CommentView } from "@/components/tier-list/comments-section";
import { ListDescription } from "@/components/tier-list/list-description";
import { EditListDetailsForm } from "@/components/tier-list/edit-list-details-form";
import { ListActionsBar } from "@/components/tier-list/list-actions-bar";
import { ListDetailView } from "@/components/tier-list/list-detail-view";
import { OwnListView } from "@/components/tier-list/own-list-view";
import { SaveAndExitButton } from "@/components/tier-list/save-and-exit-button";
import { TopNav } from "@/components/top-nav";
import type { Tier } from "@/lib/tiers";
import type { Card, Columns } from "@/components/tier-list/types";

type BookInfo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  description: string | null;
  authors: string[] | null;
  average_rating: number | null;
};

type TierListRow = {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  user_id: string;
  is_public: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
};

type TierListItemRow = {
  id: string;
  tier: Tier;
  position: number;
  books: BookInfo;
};

type CommentRow = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export default async function TierListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    edit?: string;
    new?: string;
    manage?: string;
  }>;
}) {
  const { id } = await params;
  const { edit, new: isNewParam, manage } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tierList } = await supabase
    .from("tier_lists")
    .select(
      "id, title, description, tags, user_id, is_public, like_count, comment_count, created_at",
    )
    .eq("id", id)
    .maybeSingle<TierListRow>();

  if (!tierList) {
    notFound();
  }

  const isOwner = user?.id === tierList.user_id;

  const { data: items } = await supabase
    .from("tier_list_items")
    .select(
      "id, tier, position, books(id, title, thumbnail_url, description, authors, average_rating)",
    )
    .eq("tier_list_id", id)
    .order("position", { ascending: true })
    .returns<TierListItemRow[]>();

  const initialColumns: Columns = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
    unranked: [],
  };

  const detailedColumns: DetailedColumns = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
  };

  for (const item of items ?? []) {
    const card: Card = {
      bookId: item.books.id,
      itemId: item.id,
      title: item.books.title,
      thumbnail: item.books.thumbnail_url,
    };
    initialColumns[item.tier].push(card);

    if (item.tier !== "unranked") {
      detailedColumns[item.tier].push({
        id: item.books.id,
        title: item.books.title,
        thumbnail: item.books.thumbnail_url,
        description: item.books.description,
        authors: item.books.authors,
        averageRating: item.books.average_rating,
      });
    }
  }

  // Full create/publish flow — only for a still-in-progress list (a brand
  // new one, or a draft picked back up from Profile).
  if (isOwner && edit === "true") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
        <EditListDetailsForm
          tierListId={id}
          title={tierList.title}
          description={tierList.description}
          tags={tierList.tags}
          isPublic={tierList.is_public}
          isNew={isNewParam === "true"}
          initialColumns={initialColumns}
        />
      </div>
    );
  }

  // Manage view — reached from the 3-dot menu's Edit item on an already-
  // published list. Simplified: no Cancel/Publish/review dance (it's
  // already live), just the interactive board plus a single Save that
  // returns to Profile. Board edits are already saved as they happen
  // (moveBookToTier etc.), so Save has nothing left to persist beyond
  // that — see finishManagingList.
  if (isOwner && manage === "true") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
        <TopNav />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {tierList.title}
            </h1>
            <ListDescription
              description={tierList.description}
              tags={tierList.tags}
            />
          </div>
          <SaveAndExitButton />
        </div>

        <StandaloneTierBoard tierListId={id} initialColumns={initialColumns} />

        <ListActionsBar tierListId={id} />
      </div>
    );
  }

  // Default view — a finished list, viewed by its owner or anyone else.
  // Genuinely separate components (OwnListView vs. ListDetailView) — see
  // their own doc comments for why they're kept apart rather than one
  // component branching on isOwner.
  const [{ data: comments }, isLiked, isFollowing, matchPercentage] =
    await Promise.all([
      supabase
        .from("list_comments")
        .select("id, body, user_id, created_at")
        .eq("tier_list_id", id)
        .order("created_at", { ascending: true })
        .returns<CommentRow[]>(),
      user
        ? supabase
            .from("list_likes")
            .select("tier_list_id")
            .eq("tier_list_id", id)
            .eq("user_id", user.id)
            .maybeSingle()
            .then(({ data }) => Boolean(data))
        : Promise.resolve(false),
      !isOwner && user
        ? supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .eq("following_id", tierList.user_id)
            .maybeSingle()
            .then(({ data }) => Boolean(data))
        : Promise.resolve(false),
      !isOwner && user
        ? Promise.all([
            getBookScores(supabase, user.id),
            getBookScores(supabase, tierList.user_id),
          ]).then(([myScores, theirScores]) =>
            computeMatch(myScores, theirScores).percentage,
          )
        : Promise.resolve(null),
    ]);

  const { data: creator } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", tierList.user_id)
    .maybeSingle<ProfileRow>();

  const commenterIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: commenterProfiles } =
    commenterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", commenterIds)
          .returns<ProfileRow[]>()
      : { data: [] as ProfileRow[] };

  const profileByUserId = new Map(
    (commenterProfiles ?? []).map((profile) => [profile.id, profile]),
  );

  const commentViews: CommentView[] = (comments ?? []).map((comment) => ({
    id: comment.id,
    body: comment.body,
    username: profileByUserId.get(comment.user_id)?.username ?? "unknown",
    avatarUrl: profileByUserId.get(comment.user_id)?.avatar_url ?? null,
    createdAt: comment.created_at,
    isOwn: comment.user_id === user?.id,
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
      {isOwner ? (
        <OwnListView
          tierListId={id}
          title={tierList.title}
          description={tierList.description}
          tags={tierList.tags}
          columns={detailedColumns}
        />
      ) : (
        creator && (
          <ListDetailView
            title={tierList.title}
            description={tierList.description}
            tags={tierList.tags}
            creatorUsername={creator.username}
            creatorAvatarUrl={creator.avatar_url}
            createdAt={tierList.created_at}
            targetUserId={tierList.user_id}
            isFollowing={isFollowing}
            showFollow={Boolean(user)}
            matchPercentage={matchPercentage}
            columns={detailedColumns}
          />
        )
      )}
      <CommentsSection
        tierListId={id}
        likeCount={tierList.like_count}
        isLiked={isLiked}
        comments={commentViews}
        canComment={Boolean(user)}
      />
    </div>
  );
}
