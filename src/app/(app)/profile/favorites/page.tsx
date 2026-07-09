import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { FavoritesGrid } from "@/components/favorites-grid";
import { BackButton } from "@/components/back-button";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const books = await getFavoriteBooks(supabase, user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-semibold text-foreground">Favorites</h1>
      </div>
      <FavoritesGrid books={books} />
    </div>
  );
}
