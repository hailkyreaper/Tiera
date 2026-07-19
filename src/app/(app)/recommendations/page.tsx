import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecommendations } from "@/lib/db/recommendations";
import { recordRecommendationImpressions } from "@/lib/db/recommendation-outcomes";
import { RecommendationRow } from "@/components/recommendation-row";
import { buttonVariants } from "@/components/ui/button";

const DEFAULT_LIMIT = 5;
const PAGE_SIZE = 5;

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const { limit: rawLimit } = await searchParams;
  const parsedLimit = parseInt(rawLimit ?? "", 10);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : DEFAULT_LIMIT;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { recommendations, usedThreshold, viewerBooksRanked } =
    await getRecommendations(supabase, user.id, limit);

  await recordRecommendationImpressions(
    supabase,
    recommendations.map((recommendation) => ({
      viewerUserId: user.id,
      sourceUserId: recommendation.sourceUserId,
      bookId: recommendation.bookId,
      source: "standalone",
      matchPercentage: recommendation.matchPercentage,
      sharedBookCount: recommendation.sharedBookCount,
      viewerBooksRanked,
      sourceBooksRanked: recommendation.sourceBooksRanked,
    })),
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <div className="flex flex-col gap-1 text-left">
        <h1 className="text-2xl font-semibold text-foreground">
          Recommendations
        </h1>
        <p className="text-sm text-muted-foreground">
          {usedThreshold === null
            ? "Rank more books and compare with others to unlock recommendations."
            : `Based on users with ${usedThreshold}%+ similarity`}
        </p>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recommendations yet — once you and others have ranked some of
          the same books, matches will show up here.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {recommendations.map((recommendation) => (
              <RecommendationRow
                key={recommendation.bookId}
                recommendation={recommendation}
                path={`/recommendations?limit=${limit}`}
                source="standalone"
              />
            ))}
          </div>

          {recommendations.length === limit && (
            <Link
              href={`/recommendations?limit=${limit + PAGE_SIZE}`}
              className={buttonVariants({ className: "w-full" })}
            >
              View More Recommendations
            </Link>
          )}
        </>
      )}
    </div>
  );
}
