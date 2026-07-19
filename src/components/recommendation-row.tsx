import { BookCover } from "@/components/book-cover";
import { MatchBadge } from "@/components/match-badge";
import { Button } from "@/components/ui/button";
import { BookDetailDrawer } from "@/components/tier-list/book-detail-drawer";
import {
  addRecommendationToLibrary,
  logRecommendationOpened,
} from "@/lib/actions/library";
import type { RecommendationSource } from "@/lib/db/recommendation-outcomes";

// Deliberately narrower than BookRecommendation/MatchRecommendation (this
// app's two different recommendation-source types) — only the fields this
// component actually renders, so either type satisfies it without needing
// to carry the other's analytics-only fields (sourceUserId, sharedBookCount,
// etc.) just to type-check here.
type RecommendationCardData = {
  bookId: string;
  title: string;
  authors: string[] | null;
  thumbnail: string | null;
  matchPercentage: number;
  description: string | null;
  averageRating: number | null;
};

export function RecommendationRow({
  recommendation,
  path,
  source,
}: {
  recommendation: RecommendationCardData;
  path: string;
  // Which surface this row is rendered on — passed through as a hidden
  // field so the Add click can mark the exact matching
  // recommendation_outcomes row (same book can be recommended on more than
  // one surface at once).
  source: RecommendationSource;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm bg-card p-3 ring-1 ring-foreground/10">
      {/* Cover + text wrapped in the same detail drawer used elsewhere for
       * viewing a book's synopsis — gives a real middle funnel stage
       * between "shown" and "added" (previously nothing: a recommendation
       * could only be ignored outright or committed to via Add, with no way
       * to tell those two apart). The Add button stays outside this
       * trigger so it doesn't also pop the drawer open. */}
      <BookDetailDrawer
        book={{
          id: recommendation.bookId,
          title: recommendation.title,
          thumbnail: recommendation.thumbnail,
          description: recommendation.description,
          authors: recommendation.authors,
          averageRating: recommendation.averageRating,
        }}
        onOpen={logRecommendationOpened.bind(
          null,
          recommendation.bookId,
          source,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="w-12 shrink-0">
            <BookCover
              src={recommendation.thumbnail}
              alt={recommendation.title}
              size={48}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-semibold text-foreground">
              {recommendation.title}
            </span>
            <span className="truncate text-sm text-muted-foreground">
              {recommendation.authors?.[0] ?? "Unknown author"}
            </span>
            <MatchBadge percentage={recommendation.matchPercentage} />
          </div>
        </div>
      </BookDetailDrawer>
      <form action={addRecommendationToLibrary}>
        <input type="hidden" name="bookId" value={recommendation.bookId} />
        <input type="hidden" name="path" value={path} />
        <input type="hidden" name="source" value={source} />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>
    </div>
  );
}
