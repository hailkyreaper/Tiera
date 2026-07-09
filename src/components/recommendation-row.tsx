import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { addRecommendationToLibrary } from "@/lib/actions/library";
import type { BookRecommendation } from "@/lib/db/recommendations";

export function RecommendationRow({
  recommendation,
  path,
}: {
  recommendation: BookRecommendation;
  path: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm bg-card p-3 ring-1 ring-foreground/10">
      <div className="w-12 shrink-0">
        <BookCover
          src={recommendation.thumbnail}
          alt={recommendation.title}
          size={48}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="truncate font-semibold text-foreground">
          {recommendation.title}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {recommendation.authors?.[0] ?? "Unknown author"}
        </span>
        <span className="text-xs font-medium text-primary">
          {recommendation.matchPercentage}% match
        </span>
      </div>
      <form action={addRecommendationToLibrary}>
        <input type="hidden" name="bookId" value={recommendation.bookId} />
        <input type="hidden" name="path" value={path} />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>
    </div>
  );
}
