import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { FavoritesGrid } from "@/components/favorites-grid";
import { TopNav } from "@/components/top-nav";

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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
      <TopNav title="Favorites" />
      <FavoritesGrid books={books} />
    </div>
  );
}
