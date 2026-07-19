import { RecommendationRow } from "@/components/recommendation-row";
import type { MatchRecommendation } from "@/lib/db/taste-match";
import { cn } from "@/lib/utils";

// Right-rail version of the old inline "Based on this match, you might
// like" section (design2/04) — same getMatchRecommendations data/
// RecommendationRow the page already used, just relocated rather than
// rebuilt. Takes the already-fetched list as a prop (computed alongside the
// rest of the page's comparison summary in one Promise.all) instead of
// querying again itself.
//
// `bare` drops the card box/padding — see DisagreementsRail's comment for
// the mobile-inline-vs-desktop-aside reasoning, same here.
export function MatchRecommendationsRail({
  recommendations,
  path,
  bare = false,
}: {
  recommendations: MatchRecommendation[];
  path: string;
  bare?: boolean;
}) {
  if (recommendations.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        !bare && "rounded-sm bg-card p-6",
      )}
    >
      <h2 className="text-base font-semibold text-foreground">
        Recommendations
      </h2>
      <p className="-mt-2 text-sm text-muted-foreground">
        Books you might both enjoy
      </p>

      <div className="flex flex-col gap-2">
        {recommendations.map((recommendation) => (
          <RecommendationRow
            key={recommendation.bookId}
            recommendation={recommendation}
            path={path}
            source="compare_detail"
          />
        ))}
      </div>
    </div>
  );
}
