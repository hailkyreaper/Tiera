import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { FavoritesGrid } from "@/components/favorites-grid";
import { TopNav } from "@/components/top-nav";

type ProfileRow = { id: string; username: string };

export default async function UserFavoritesPage({
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

  const books = await getFavoriteBooks(supabase, profile.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
      <TopNav title={`@${profile.username}'s Favorites`} />
      <FavoritesGrid books={books} />
    </div>
  );
}
