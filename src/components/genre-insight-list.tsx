import type { GenreInsight } from "@/lib/db/genre-insights";

export function GenreInsightList({ genres }: { genres: GenreInsight[] }) {
  return (
    <div className="flex flex-col gap-3">
      {genres.map((genre) => (
        <div key={genre.genre} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{genre.genre}</span>
            <span className="text-muted-foreground">{genre.percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${genre.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
