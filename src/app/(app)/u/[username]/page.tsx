import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FavoritesRow } from "@/components/favorites-row";
import { ExploreListCard } from "@/components/explore/list-card";
import { BackButton } from "@/components/back-button";
import { FollowButton } from "@/components/follow-button";
import { Avatar } from "@/components/avatar";
import { ProfileBio } from "@/components/profile-bio";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { getUserListCards } from "@/lib/db/list-cards";
import { cn } from "@/lib/utils";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
};

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, location, created_at")
    .ilike("username", username)
    .maybeSingle<ProfileRow>();

  if (!profile) {
    notFound();
  }

  if (user?.id === profile.id) {
    redirect("/profile");
  }

  const { data: theirLists } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("user_id", profile.id);

  const listIds = (theirLists ?? []).map((list) => list.id);
  const listsCount = listIds.length;

  const { count: booksRankedCount } =
    listIds.length > 0
      ? await supabase
          .from("tier_list_items")
          .select("id", { count: "exact", head: true })
          .in("tier_list_id", listIds)
          .neq("tier", "unranked")
      : { count: 0 };

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isFollowing = user
    ? Boolean(
        (
          await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .eq("following_id", profile.id)
            .maybeSingle()
        ).data,
      )
    : false;

  const favoriteBooks = await getFavoriteBooks(supabase, profile.id, 5);
  const listCards = await getUserListCards(supabase, profile.id, {
    publicOnly: true,
    viewerId: user?.id,
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <BackButton />
          {user && (
            <FollowButton
              targetUserId={profile.id}
              username={profile.username}
              isFollowing={isFollowing}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full p-1">
            <Avatar
              src={profile.avatar_url}
              name={profile.username}
              imageSize={144}
              sizeClassName="size-16"
              textClassName="text-2xl"
              className="ring-2 ring-primary"
            />
          </div>

          <div className="flex min-w-0 flex-col items-start">
            {profile.display_name && (
              <p className="truncate text-lg font-semibold text-foreground">
                {profile.display_name}
              </p>
            )}
            <p
              className={cn(
                "truncate",
                profile.display_name
                  ? "text-sm text-muted-foreground"
                  : "text-lg font-semibold text-foreground",
              )}
            >
              @{profile.username}
            </p>
          </div>
        </div>

        <ProfileBio
          bio={profile.bio}
          location={profile.location}
          joinedDate={joinedDate}
          metaInline
          className="flex flex-col items-start gap-1 text-left"
        />

        <div className="flex w-full divide-x divide-border/60 border-y border-border/60 py-3">
          <div className="flex flex-1 flex-col items-center">
            <span className="text-lg font-semibold text-foreground">
              {listsCount}
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Tier Lists
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <span className="text-lg font-semibold text-foreground">
              {booksRankedCount ?? 0}
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Books Ranked
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <span className="text-lg font-semibold text-muted-foreground">
              —
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Avg Match
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 px-4 pt-4 pb-4 text-center">
        <FavoritesRow
          books={favoriteBooks}
          viewMoreHref={`/u/${profile.username}/favorites`}
        />

        <div className="flex w-full flex-col gap-3">
          <h2 className="text-xs font-semibold text-left text-muted-foreground uppercase">
            Lists
          </h2>
          {listCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No public tier lists yet.
            </p>
          ) : (
            listCards.map((list) => (
              <ExploreListCard
                key={list.id}
                id={list.id}
                title={list.title}
                username={profile.username}
                avatarUrl={profile.avatar_url}
                createdAt={list.createdAt}
                likeCount={list.likeCount}
                commentCount={list.commentCount}
                matchPercentage={list.matchPercentage}
                preview={list.preview}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
