import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, Bookmark, BookOpen, MapPin, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";
import {
  getBookScores,
  getComparisonSummary,
  getDiscoveryCounts,
  computeGenreAlignment,
  getMatchRecommendations,
  MIN_RECOMMENDATION_SHARED_BOOKS,
  MIN_RECOMMENDATION_MATCH_PERCENTAGE,
} from "@/lib/db/taste-match";
import { recordRecommendationImpressions } from "@/lib/db/recommendation-outcomes";
import { SharedRankingRow } from "@/components/shared-ranking-row";
import { AgreementBreakdown } from "@/components/agreement-breakdown";
import { RecommendationCoverStrip } from "@/components/recommendation-cover-strip";
import { MatchRing } from "@/components/match-ring";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};
type TheirProfileRow = ProfileRow & { location: string | null };

// Same "?limit=" + "View More" pagination shape as the standalone
// Recommendations page (recommendations/page.tsx) — default matches
// getMatchRecommendations' own default of 4.
const DEFAULT_RECS_LIMIT = 4;
const RECS_PAGE_SIZE = 4;

// How many rows of the Shared Ranking list show before "View all" —
// unlike Recommendations (which fetches externally), the full list is
// already in memory from getComparisonSummary, so "View all" just lifts
// the slice rather than paging through more queries.
const DEFAULT_SHARED_DISPLAY = 5;

export default async function CompareWithUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ recsLimit?: string; allShared?: string }>;
}) {
  const { username } = await params;
  const { recsLimit: rawRecsLimit, allShared: rawAllShared } =
    await searchParams;
  const parsedRecsLimit = parseInt(rawRecsLimit ?? "", 10);
  const recsLimit =
    Number.isFinite(parsedRecsLimit) && parsedRecsLimit > 0
      ? parsedRecsLimit
      : DEFAULT_RECS_LIMIT;
  const showAllShared = rawAllShared === "true";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const me = assertNoSupabaseError(
    await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    "fetching your profile",
  );

  const them = assertNoSupabaseError(
    await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, location")
      .ilike("username", username)
      .maybeSingle<TheirProfileRow>(),
    "fetching their profile",
  );

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

  // Fetched once, reused for discovery counts below and the recommendation-
  // impression analytics further down — getComparisonSummary computes its
  // own copies of these internally too (a small accepted redundant read,
  // traded for not having to plumb score maps out of its return shape).
  const [summary, myScores, theirScores] = await Promise.all([
    getComparisonSummary(supabase, me.id, them.id),
    getBookScores(supabase, me.id),
    getBookScores(supabase, them.id),
  ]);
  const { match, bothLove, disagreeOn, sharedDislikes, shared, topSharedGenre } =
    summary;

  const discoveryCounts =
    match.percentage !== null
      ? await getDiscoveryCounts(supabase, me.id, them.id, myScores, theirScores)
      : null;

  const genreAlignment = computeGenreAlignment(shared, topSharedGenre);
  // % of shared books where you're NOT in a real disagreement (gap < 2) —
  // not just the narrower "both rated it A-tier or higher." That narrower
  // version (bothLove.length / sharedBookCount) read as misleadingly low
  // for pairs who agree closely but rarely both reach A/S specifically —
  // confirmed live: a 95%-match pair with 0 real disagreements across 12
  // shared books still showed "50% top tier agreement," since half their
  // agreed-upon books topped out at B or C for both, not A+.
  const tierAlignment =
    match.sharedBookCount > 0
      ? Math.round(
          ((match.sharedBookCount - disagreeOn.length) /
            match.sharedBookCount) *
            100,
        )
      : 0;
  const lowTierAgreement =
    match.sharedBookCount > 0
      ? Math.round((sharedDislikes.length / match.sharedBookCount) * 100)
      : 0;

  let calloutHeadline: string | null = null;
  if (match.percentage !== null) {
    if (match.percentage >= 85) {
      calloutHeadline = "You have amazing taste in common!";
    } else if (match.percentage >= MIN_RECOMMENDATION_MATCH_PERCENTAGE) {
      calloutHeadline = "You have great taste in common!";
    }
  }
  const showCallout = calloutHeadline !== null && bothLove.length > 0;

  const sortedShared = [...shared].sort(
    (a, b) => b.scoreA + b.scoreB - (a.scoreA + a.scoreB),
  );
  const hasMoreShared = sortedShared.length > DEFAULT_SHARED_DISPLAY;
  const sharedToShow = showAllShared
    ? sortedShared
    : sortedShared.slice(0, DEFAULT_SHARED_DISPLAY);

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
      ? await getMatchRecommendations(
          supabase,
          me.id,
          them.id,
          match.percentage,
          recsLimit,
        )
      : [];

  const recsMoreHref =
    matchRecommendations.length === recsLimit
      ? `/compare/${username}?recsLimit=${recsLimit + RECS_PAGE_SIZE}`
      : undefined;

  if (matchRecommendations.length > 0) {
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

  const theirName = them.display_name ?? them.username;
  // "Maya Summers" -> "Maya" for the recommendations heading — first name
  // only reads friendlier than a full display name or a bare username
  // there. Falls back to the full username when there's no display name
  // (usernames don't really have a "first" part to split on).
  const theirFirstName = them.display_name
    ? them.display_name.split(" ")[0]
    : them.username;
  // "View more" (below) extends the cover strip into a wrapping grid
  // rather than adding more items to scroll through sideways — this is
  // true once recsLimit has been bumped past its default via that link.
  const recsExpanded = recsLimit > DEFAULT_RECS_LIMIT;

  return (
    <div className="flex w-full flex-1 gap-6 p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 xl:max-w-4xl">
        <TopNav title={theirName} center />

        <div className="flex items-start gap-4">
          <Avatar
            src={them.avatar_url}
            name={them.username}
            imageSize={72}
            sizeClassName="size-[72px]"
            textClassName="text-xl"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
            <span className="block w-fit max-w-full truncate text-lg font-bold text-foreground">
              {theirName}
            </span>
            <Link
              href={`/u/${them.username}`}
              className="block w-fit max-w-full truncate text-sm text-muted-foreground hover:underline"
            >
              @{them.username}
            </Link>
            {them.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                {them.location}
              </span>
            )}
            {topSharedGenre && (
              <span className="mt-1.5 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary-link">
                {topSharedGenre}
              </span>
            )}
          </div>

          {match.percentage !== null ? (
            <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
              <MatchRing percentage={match.percentage} size={72} strokeWidth={5}>
                <span className="text-base font-extrabold text-foreground">
                  {match.percentage}%
                </span>
              </MatchRing>
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Taste Match
              </span>
            </div>
          ) : (
            <p className="w-28 shrink-0 text-right text-xs text-muted-foreground">
              Not enough shared books yet ({match.sharedBookCount}/3)
            </p>
          )}
        </div>

        {match.percentage !== null && discoveryCounts && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 rounded-sm bg-card p-3 text-center">
                <Bookmark className="size-4 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  {match.sharedBookCount}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  Shared Books
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-sm bg-card p-3 text-center">
                <BookOpen className="size-4 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  {discoveryCounts.viewerUnread}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  Favorites unread
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-sm bg-card p-3 text-center">
                <AlertTriangle className="size-4 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  {disagreeOn.length}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  Disagreements
                </span>
              </div>
            </div>

            {showCallout && (
              <div className="flex items-start gap-2.5 rounded-sm bg-primary/10 p-3.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{calloutHeadline}</span>{" "}
                  <span className="text-muted-foreground">
                    You agreed on {bothLove.length} of your{" "}
                    {match.sharedBookCount} shared books.
                  </span>
                </p>
              </div>
            )}

            <AgreementBreakdown
              tierAlignment={tierAlignment}
              genreAlignment={genreAlignment}
              lowTierAgreement={lowTierAgreement}
            />

            <div className="flex flex-col gap-3 text-left">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Shared Ranking
                </h2>
                {hasMoreShared && !showAllShared && (
                  <Link
                    href={`/compare/${username}?allShared=true&recsLimit=${recsLimit}`}
                    className="text-sm font-medium text-primary-link"
                  >
                    View all
                  </Link>
                )}
              </div>
              {sharedToShow.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shared books yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {sharedToShow.map((book) => (
                    <SharedRankingRow key={book.bookId} book={book} />
                  ))}
                </div>
              )}
            </div>

            {/* Below xl, the right-rail aside further down doesn't render
             * at all (it's xl:flex) — this was the only place
             * Recommendations ever showed, so mobile/tablet never saw it.
             * Same data, rendered again here and hidden at xl (where the
             * aside takes over instead), matching the "duplicate but only
             * one ever visible via CSS" approach already used elsewhere in
             * the app. */}
            {matchRecommendations.length > 0 && (
              <div className="xl:hidden">
                <RecommendationCoverStrip
                  recommendations={matchRecommendations}
                  heading={`From ${theirFirstName}'s Favorites`}
                  moreHref={recsMoreHref}
                  expanded={recsExpanded}
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

      {match.percentage !== null && matchRecommendations.length > 0 && (
        <aside className="sticky top-4 hidden h-fit w-96 shrink-0 flex-col gap-4 rounded-sm bg-card p-6 xl:flex">
          <RecommendationCoverStrip
            recommendations={matchRecommendations}
            heading={`From ${theirFirstName}'s Favorites`}
            moreHref={recsMoreHref}
            expanded={recsExpanded}
          />
        </aside>
      )}
    </div>
  );
}
