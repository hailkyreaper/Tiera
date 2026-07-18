import { createClient } from "@/lib/supabase/server";
import { getPopularGenres } from "@/lib/db/discovery";

// Explore-only panel (design2/01) — top categories tallied across every
// ranked tier_list_items row app-wide (see getPopularGenres), not per-user.
export async function PopularGenresRail() {
  const supabase = await createClient();
  const genres = await getPopularGenres(supabase);

  if (genres.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-sm bg-card p-6">
      <h2 className="text-base font-semibold text-foreground">
        Popular Genres
      </h2>

      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <span
            key={genre}
            className="rounded-sm bg-muted px-3 py-1.5 text-sm font-medium text-foreground"
          >
            {genre}
          </span>
        ))}
      </div>
    </div>
  );
}
