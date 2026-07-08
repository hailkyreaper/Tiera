import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecommendations } from "@/lib/db/recommendations";
import { RecommendationRow } from "@/components/recommendation-row";

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

  const { recommendations, usedThreshold } = await getRecommendations(
    supabase,
    user.id,
    limit,
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
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
        <p className="text-muted-foreground">
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
              />
            ))}
          </div>

          {recommendations.length === limit && (
            <Link
              href={`/recommendations?limit=${limit + PAGE_SIZE}`}
              className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              View More Recommendations
            </Link>
          )}
        </>
      )}
    </div>
  );
}
