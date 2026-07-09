import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { MapPin, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FavoritesRow } from "@/components/favorites-row";
import { ExploreListCard } from "@/components/explore/list-card";
import { BackButton } from "@/components/back-button";
import { FollowButton } from "@/components/follow-button";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { getUserListCards } from "@/lib/db/list-cards";

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
      <div className="relative flex h-40 items-center justify-center rounded-b-[20px] bg-gradient-to-br from-primary/60 via-indigo-950 to-purple-950">
        <div className="absolute top-4 left-4">
          <BackButton />
        </div>

        {user && (
          <div className="absolute top-4 right-4">
            <FollowButton
              targetUserId={profile.id}
              username={profile.username}
              isFollowing={isFollowing}
            />
          </div>
        )}

        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.username}
            width={96}
            height={96}
            className="size-24 rounded-full object-cover ring-4 ring-primary"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground ring-4 ring-primary">
            {profile.username[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 px-6 pt-6 pb-12 text-center">
        <div>
          {profile.display_name && (
            <p className="text-lg font-semibold text-foreground">
              {profile.display_name}
            </p>
          )}
          <p
            className={
              profile.display_name
                ? "text-sm text-muted-foreground"
                : "text-lg font-semibold text-foreground"
            }
          >
            @{profile.username}
          </p>
        </div>

        <div className="flex w-full justify-around">
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-foreground">
              {listsCount}
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Lists
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-foreground">
              {booksRankedCount ?? 0}
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Books Ranked
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-muted-foreground">
              —
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Avg Match
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-1 text-left">
          {profile.bio && (
            <p className="text-sm text-foreground">{profile.bio}</p>
          )}
          {profile.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {profile.location}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Joined {joinedDate}
          </span>
        </div>

        <FavoritesRow
          books={favoriteBooks}
          viewMoreHref={`/u/${profile.username}/favorites`}
        />

        <div className="flex w-full flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase">
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
