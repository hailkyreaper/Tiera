import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRecommendations } from "@/lib/db/recommendations";
import { RecommendationRow } from "@/components/recommendation-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RAIL_LIMIT = 4;

// Desktop-only right rail for the empty column next to Profile's own list
// feed — same `TopMatchesRail` shell (sticky bg-card panel, xl breakpoint)
// but a preview of the existing Recommendations feature instead, reusing
// its real `getRecommendations` data/logic and `RecommendationRow` as-is
// rather than inventing a rail-specific row style.
export async function RecommendationsRail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { recommendations } = await getRecommendations(
    supabase,
    user.id,
    RAIL_LIMIT,
  );

  return (
    <aside className="sticky top-4 hidden h-fit w-96 shrink-0 flex-col gap-4 rounded-sm bg-card p-6 xl:flex">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Recommended for You
        </h2>
        <Link href="/recommendations" className="text-sm font-medium text-primary">
          View all
        </Link>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Rank more books to unlock recommendations.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {recommendations.map((recommendation) => (
            <RecommendationRow
              key={recommendation.bookId}
              recommendation={recommendation}
              path="/profile"
            />
          ))}
        </div>
      )}

      <Link
        href="/recommendations"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <Sparkles className="size-4" />
        More recommendations
      </Link>
    </aside>
  );
}
