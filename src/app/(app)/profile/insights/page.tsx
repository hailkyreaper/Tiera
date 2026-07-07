import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGenreInsights } from "@/lib/db/genre-insights";
import { GenreInsightList } from "@/components/genre-insight-list";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { genres, learningGenres } = await getGenreInsights(supabase, user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">
        Your Taste Insights
      </h1>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">
          Top Genres
        </h2>
        {genres.length === 0 && learningGenres.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rank some books to see insights here.
          </p>
        ) : (
          <>
            {genres.length > 0 && <GenreInsightList genres={genres} />}
            {learningGenres.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Still learning your taste in {learningGenres.join(", ")} —
                read more to see them here.
              </p>
            )}
          </>
        )}
      </div>

      <Link href="/profile" className="text-sm text-primary">
        ← Back to profile
      </Link>
    </div>
  );
}
