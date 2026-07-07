import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FavoritesRow } from "@/components/favorites-row";
import { ExploreListCard } from "@/components/explore/list-card";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { getUserListCards } from "@/lib/db/list-cards";

type ProfileRow = { id: string; username: string };

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .maybeSingle<ProfileRow>();

  if (!profile) {
    notFound();
  }

  const favoriteBooks = await getFavoriteBooks(supabase, profile.id, 5);
  const listCards = await getUserListCards(supabase, profile.id, {
    publicOnly: true,
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">
        @{profile.username}
      </h1>

      <FavoritesRow
        books={favoriteBooks}
        viewMoreHref={`/u/${profile.username}/favorites`}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase">
          Lists
        </h2>
        {listCards.length === 0 ? (
          <p className="text-muted-foreground">No public tier lists yet.</p>
        ) : (
          listCards.map((list) => (
            <ExploreListCard
              key={list.id}
              id={list.id}
              title={list.title}
              username={profile.username}
              likeCount={list.likeCount}
              commentCount={list.commentCount}
              preview={list.preview}
            />
          ))
        )}
      </div>
    </div>
  );
}
