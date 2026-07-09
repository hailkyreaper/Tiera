import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { FavoritesGrid } from "@/components/favorites-grid";
import { BackButton } from "@/components/back-button";

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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-semibold text-foreground">
          @{profile.username}&apos;s Favorites
        </h1>
      </div>
      <FavoritesGrid books={books} />
    </div>
  );
}
