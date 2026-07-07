import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { FavoritesGrid } from "@/components/favorites-grid";

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
      <h1 className="text-xl font-semibold text-foreground">Favorites</h1>
      <FavoritesGrid books={books} />
      <Link href="/profile" className="text-sm text-primary">
        ← Back
      </Link>
    </div>
  );
}
