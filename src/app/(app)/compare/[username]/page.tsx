import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getBookScores,
  getComparisonSummary,
  getMatchRecommendations,
  MIN_RECOMMENDATION_SHARED_BOOKS,
  MIN_RECOMMENDATION_MATCH_PERCENTAGE,
} from "@/lib/db/taste-match";
import { recordRecommendationImpressions } from "@/lib/db/recommendation-outcomes";
import { MatchedBookRow } from "@/components/matched-book-row";
import { CompareStatsRow } from "@/components/compare-stats-row";
import { DisagreementsRail } from "@/components/disagreements-rail";
import { MatchRecommendationsRail } from "@/components/match-recommendations-rail";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default async function CompareWithUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const { data: them } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", username)
    .maybeSingle<ProfileRow>();

  if (!me || !them) {
    notFound();
  }

  if (them.id === me.id) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Compare</h1>
        <p className="text-muted-foreground">
          That&apos;s you! Search for someone else to compare with.
        </p>
      </div>
    );
  }

  const { match, bothLove, disagreeOn, sharedDislikes, topSharedGenre } =
    await getComparisonSummary(supabase, me.id, them.id);

  // Recommendations (and every summary panel below) only make sense once
  // there's a real match — see the audit: this used to run unconditionally,
  // so a pair with "not enough shared books yet" could still show a
  // confident-looking "Based on this match, you might like" section.
  // Recommendations specifically need both MIN_RECOMMENDATION_SHARED_BOOKS
  // (8) and MIN_RECOMMENDATION_MATCH_PERCENTAGE (65) — stricter than the
  // bare 3-book/non-null minimum a match % itself needs. A "strong pre-rec"
  // means real agreement across many books, not just a lot of shared books
  // (a high-volume but low-percentage match, e.g. someone with genuinely
  // opposite taste, shouldn't get recommendations just because they've
  // ranked a lot of the same titles).
  const matchRecommendations =
    match.percentage !== null &&
    match.percentage >= MIN_RECOMMENDATION_MATCH_PERCENTAGE &&
    match.sharedBookCount >= MIN_RECOMMENDATION_SHARED_BOOKS
      ? await getMatchRecommendations(supabase, me.id, them.id, match.percentage)
      : [];

  if (matchRecommendations.length > 0) {
    // getComparisonSummary already computes both people's book scores
    // internally to build `match` — these two calls are a small redundant
    // read (getBookScores itself, not the rest of the summary), traded for
    // not having to plumb ranked-counts out of getComparisonSummary's
    // return shape just for this analytics log.
    const [myScores, theirScores] = await Promise.all([
      getBookScores(supabase, me.id),
      getBookScores(supabase, them.id),
    ]);

    await recordRecommendationImpressions(
      supabase,
      matchRecommendations.map((recommendation) => ({
        viewerUserId: me.id,
        sourceUserId: them.id,
        bookId: recommendation.bookId,
        source: "compare_detail",
        matchPercentage: match.percentage!,
        sharedBookCount: match.sharedBookCount,
        viewerBooksRanked: myScores.size,
        sourceBooksRanked: theirScores.size,
        sharedFavoritesCount: bothLove.length,
        sharedDislikesCount: sharedDislikes.length,
        disagreementsCount: disagreeOn.length,
      })),
    );
  }

  return (
    <div className="flex w-full flex-1 gap-6 p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 xl:max-w-4xl">
        <TopNav title="Compare" center />

        {/* No card fill or border (user's call) — just an equal-thirds
         * grid so every column is exactly the same width regardless of its
         * content's natural size, with each grid item centering its own
         * content. Equal flex-1 widths alone (the original approach)
         * got the math right but uneven column heights (e.g. a wrapping
         * display name) still read as misaligned with nothing to visually
         * anchor each section. */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="flex flex-col items-center justify-center gap-2 p-1.5 text-center">
            <Avatar
              src={me.avatar_url}
              name={me.username}
              imageSize={64}
              sizeClassName="size-16"
              textClassName="text-lg"
              className="ring-4 ring-primary"
            />
            {/* w-full on the text itself (not just the wrapper) is
             * load-bearing: this wrapper's items-center sizes each child
             * to its own content width by default (no stretch), so
             * truncate has nothing smaller than the text to clip against
             * without it — same underlying issue as BookDetailDrawer's
             * missing min-w-0 earlier, one layer further in. */}
            <div className="flex w-full min-w-0 flex-col items-center">
              <span className="text-sm font-semibold text-foreground">You</span>
              <span className="w-full truncate text-xs text-muted-foreground">
                @{me.username}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 p-1.5 text-center">
            {match.percentage === null ? (
              <p className="text-sm text-muted-foreground">
                Not enough shared books yet ({match.sharedBookCount}/3)
              </p>
            ) : (
              <>
                <span className="text-4xl font-bold text-primary sm:text-5xl">
                  {match.percentage}%
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  Taste Match
                </span>
                <span className="text-xs text-muted-foreground">
                  {match.sharedBookCount} shared books
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-2 p-1.5 text-center">
            <Avatar
              src={them.avatar_url}
              name={them.username}
              imageSize={64}
              sizeClassName="size-16"
              textClassName="text-lg"
              className="ring-4 ring-primary"
            />
            <div className="flex w-full min-w-0 flex-col items-center">
              {them.display_name && (
                <span className="w-full truncate text-sm font-semibold text-foreground">
                  {them.display_name}
                </span>
              )}
              <Link
                href={`/u/${them.username}`}
                className={
                  them.display_name
                    ? "w-full truncate text-xs text-muted-foreground hover:underline"
                    : "w-full truncate text-sm font-semibold text-foreground hover:underline"
                }
              >
                @{them.username}
              </Link>
            </div>
          </div>
        </div>

        {match.percentage !== null && (
          <>
            <CompareStatsRow
              sharedFavoritesCount={bothLove.length}
              sharedDislikesCount={sharedDislikes.length}
              disagreementsCount={disagreeOn.length}
              topSharedGenre={topSharedGenre}
            />

            {/* MIN_PANEL_BOOKS gates topSharedGenre (an inference drawn
             * from bothLove — see taste-match.ts) since a genre tag off a
             * single book reads as a confident claim the data doesn't
             * support. It deliberately does NOT gate these two lists: they
             * just literally list whichever shared books qualify, so
             * showing 1 is accurate, not misleading — and gating them here
             * previously contradicted CompareStatsRow's raw count right
             * above (stat said "1," panel said "No shared dislikes yet"). */}
            <div className="flex flex-col gap-3 text-left">
              <h2 className="text-lg font-semibold text-foreground">
                Top Books You Both Love
              </h2>
              {bothLove.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shared favorites yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {bothLove.slice(0, 5).map((book) => (
                    <MatchedBookRow key={book.bookId} book={book} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 text-left">
              <h2 className="text-lg font-semibold text-foreground">
                Shared Dislikes
              </h2>
              {sharedDislikes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shared dislikes yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {sharedDislikes.slice(0, 5).map((book) => (
                    <MatchedBookRow key={book.bookId} book={book} />
                  ))}
                </div>
              )}
            </div>

            {/* Below xl, the right-rail aside further down doesn't render
             * at all (it's xl:flex) — this was the only place Biggest
             * Differences/Recommendations ever showed, so mobile/tablet
             * never saw them. Same data, rendered again here and hidden at
             * xl (where the aside takes over instead), matching the
             * "duplicate but only one ever visible via CSS" approach
             * already used elsewhere in the app. */}
            {(disagreeOn.length > 0 || matchRecommendations.length > 0) && (
              <div className="flex flex-col gap-4 xl:hidden">
                <DisagreementsRail books={disagreeOn.slice(0, 5)} bare />
                <MatchRecommendationsRail
                  recommendations={matchRecommendations}
                  path={`/compare/${username}`}
                  bare
                />
              </div>
            )}
          </>
        )}

        <Link href={`/u/${them.username}`}>
          <Button type="button" variant="outline" className="w-full">
            View Full Profile
          </Button>
        </Link>
      </div>

      {match.percentage !== null &&
        (disagreeOn.length > 0 || matchRecommendations.length > 0) && (
          <aside className="sticky top-4 hidden h-fit w-96 shrink-0 flex-col gap-4 xl:flex">
            <DisagreementsRail books={disagreeOn.slice(0, 5)} />
            <MatchRecommendationsRail
              recommendations={matchRecommendations}
              path={`/compare/${username}`}
            />
          </aside>
        )}
    </div>
  );
}
