import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeMatch, getBookScores } from "@/lib/db/taste-match";
import { TierBoard } from "@/components/tier-list/tier-board";
import { ReadOnlyTierBoard } from "@/components/tier-list/read-only-board";
import { LikeButton } from "@/components/tier-list/like-button";
import { CommentsSection, type CommentView } from "@/components/tier-list/comments-section";
import { DeleteListButton } from "@/components/tier-list/delete-list-button";
import { ListCreatorHeader } from "@/components/tier-list/list-creator-header";
import { ListDescription } from "@/components/tier-list/list-description";
import { EditListDetailsForm } from "@/components/tier-list/edit-list-details-form";
import { ListActionsBar } from "@/components/tier-list/list-actions-bar";
import { BackButton } from "@/components/back-button";
import { FollowButton } from "@/components/follow-button";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import type { Tier } from "@/lib/tiers";
import type { Card, Columns } from "@/components/tier-list/types";

type BookInfo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
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
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  const { id } = await params;
  const { edit, new: isNewParam } = await searchParams;
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
    .select("id, tier, position, books(id, title, thumbnail_url)")
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

  for (const item of items ?? []) {
    const card: Card = {
      bookId: item.books.id,
      itemId: item.id,
      title: item.books.title,
      thumbnail: item.books.thumbnail_url,
    };
    initialColumns[item.tier].push(card);
  }

  if (isOwner) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
        {edit === "true" ? (
          <EditListDetailsForm
            tierListId={id}
            title={tierList.title}
            description={tierList.description}
            tags={tierList.tags}
            isPublic={tierList.is_public}
            isNew={isNewParam === "true"}
          >
            <TierBoard tierListId={id} initialColumns={initialColumns} />
            <ListActionsBar tierListId={id} isEditing />
          </EditListDetailsForm>
        ) : (
          <>
            <BackButton />
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
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/lists/${id}?edit=true`}>
                  <Button type="button" variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <DeleteListButton tierListId={id} />
              </div>
            </div>

            <TierBoard tierListId={id} initialColumns={initialColumns} />

            <ListActionsBar tierListId={id} />
          </>
        )}
      </div>
    );
  }

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
      user
        ? supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .eq("following_id", tierList.user_id)
            .maybeSingle()
            .then(({ data }) => Boolean(data))
        : Promise.resolve(false),
      user
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <BackButton />
      {creator && (
        <ListCreatorHeader
          username={creator.username}
          avatarUrl={creator.avatar_url}
          createdAt={tierList.created_at}
          action={
            user ? (
              <FollowButton
                targetUserId={tierList.user_id}
                username={creator.username}
                isFollowing={isFollowing}
              />
            ) : undefined
          }
        />
      )}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {tierList.title}
        </h1>
        <ListDescription
          description={tierList.description}
          tags={tierList.tags}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <LikeButton
            tierListId={id}
            likeCount={tierList.like_count}
            isLiked={isLiked}
          />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="size-3.5" /> {tierList.comment_count}
          </span>
        </div>
        {matchPercentage !== null && (
          <span className="text-xs font-semibold text-primary">
            {matchPercentage}% match
          </span>
        )}
      </div>
      <ReadOnlyTierBoard columns={initialColumns} />
      <CommentsSection
        tierListId={id}
        comments={commentViews}
        canComment={Boolean(user)}
      />
    </div>
  );
}
