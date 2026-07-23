import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/assert";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/marketing/wordmark";
import { MarketingTierBoard } from "@/components/marketing/marketing-tier-board";
import { HeroListCard } from "@/components/marketing/hero-list-card";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MatchingShowcase } from "@/components/marketing/matching-showcase";
import { FriendActivity, type ActivityItem } from "@/components/marketing/friend-activity";
import { FinalCta } from "@/components/marketing/final-cta";
import { getTopMatches, type TopMatchPerson } from "@/lib/db/top-matches";
import {
  getComparisonSummary,
  getMatchRecommendations,
  MIN_RECOMMENDATION_MATCH_PERCENTAGE,
  MIN_RECOMMENDATION_SHARED_BOOKS,
} from "@/lib/db/taste-match";
import type { Tier } from "@/lib/tiers";

const serifStyle = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
};

// The founder's own real, public list — shown as-is (real likes/comments,
// real cover art) rather than a fabricated example, so the hero is
// literally a screenshot-true artifact of the app instead of marketing
// fiction. Falls back to the static typographic board (MarketingTierBoard)
// if this specific list is ever unpublished or deleted, rather than
// breaking the page over one row.
const HERO_LIST_ID = "1028d1ca-398e-4c99-8e4f-0a835e32925b";

type HeroListRow = {
  id: string;
  title: string;
  user_id: string;
  like_count: number;
  comment_count: number;
  created_at: string;
};
type HeroItemRow = {
  tier: Tier;
  books: { id: string; title: string; thumbnail_url: string | null };
};
type HeroProfileRow = { username: string; avatar_url: string | null };

// The three specific accounts to source the "Match"/"Discover" steps from,
// on both desktop and mobile — a real match's top favorites can easily turn
// out to already all be in the founder's own library (confirmed live: the
// site-wide #1 algorithmic match had zero unowned recommendations, since
// their taste overlap is thorough enough that there was nothing left to
// recommend), so getFirstAvailableMatch below tries them in this order
// until one actually has real recommendations to show.
const MATCH_USERNAMES = [
  "test_reader_sixteen",
  "test_reader_17",
  "test_reader_fourteen",
];

// Tries each candidate in order and returns the first with real, unowned
// recommendations, plus which person that came from (mobile needs both —
// the same one profile drives its single Match row and its Discover list).
async function getFirstAvailableMatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewerId: string,
  candidates: TopMatchPerson[],
) {
  for (const candidate of candidates) {
    if (
      candidate.matchPercentage < MIN_RECOMMENDATION_MATCH_PERCENTAGE ||
      candidate.sharedBookCount < MIN_RECOMMENDATION_SHARED_BOOKS
    ) {
      continue;
    }
    const recommendations = await getMatchRecommendations(
      supabase,
      viewerId,
      candidate.userId,
      candidate.matchPercentage,
      4,
    );
    if (recommendations.length > 0) return { person: candidate, recommendations };
  }
  return null;
}

type RecentActivityRow = {
  tier_list_id: string;
  created_at: string;
  books: { id: string; title: string; thumbnail_url: string | null };
};

// One real "most recently ranked book" per candidate (same three named
// accounts as the Match/Discover steps, for consistency across the whole
// page), newest first — powers the "See what your friends are reading"
// section (design2/offset.png).
async function getRecentActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  candidates: TopMatchPerson[],
): Promise<ActivityItem[]> {
  if (candidates.length === 0) return [];

  const listRows = logSupabaseError(
    await supabase
      .from("tier_lists")
      .select("id, user_id")
      .in(
        "user_id",
        candidates.map((c) => c.userId),
      ),
    "fetching activity candidates' lists",
    [],
  );
  const listIdToUserId = new Map(
    (listRows ?? []).map((l) => [l.id as string, l.user_id as string]),
  );
  const listIds = [...listIdToUserId.keys()];
  if (listIds.length === 0) return [];

  const itemRows = logSupabaseError(
    await supabase
      .from("tier_list_items")
      .select("tier_list_id, created_at, books(id, title, thumbnail_url)")
      .in("tier_list_id", listIds)
      .neq("tier", "unranked")
      .order("created_at", { ascending: false })
      .returns<RecentActivityRow[]>(),
    "fetching recent activity items",
    [],
  );

  const seenUsers = new Set<string>();
  const activity: ActivityItem[] = [];
  for (const item of itemRows ?? []) {
    const userId = listIdToUserId.get(item.tier_list_id);
    if (!userId || seenUsers.has(userId)) continue;
    const person = candidates.find((c) => c.userId === userId);
    if (!person) continue;
    seenUsers.add(userId);
    activity.push({
      userId: person.userId,
      username: person.username,
      displayName: person.displayName,
      avatarUrl: person.avatarUrl,
      bookId: item.books.id,
      bookTitle: item.books.title,
      bookThumbnail: item.books.thumbnail_url,
      createdAt: item.created_at,
    });
    if (activity.length >= 3) break;
  }
  return activity;
}

async function getHeroList(supabase: Awaited<ReturnType<typeof createClient>>) {
  const list = logSupabaseError(
    await supabase
      .from("tier_lists")
      .select("id, title, user_id, like_count, comment_count, created_at")
      .eq("id", HERO_LIST_ID)
      .eq("is_public", true)
      .maybeSingle<HeroListRow>(),
    "fetching landing page hero list",
    null,
  );
  if (!list) return null;

  const [itemsResult, profileResult] = await Promise.all([
    supabase
      .from("tier_list_items")
      .select("tier, books(id, title, thumbnail_url)")
      .eq("tier_list_id", list.id)
      .order("position", { ascending: true })
      .returns<HeroItemRow[]>(),
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", list.user_id)
      .maybeSingle<HeroProfileRow>(),
  ]);
  const items = logSupabaseError(itemsResult, "fetching landing page hero list items", []);
  const profile = logSupabaseError(profileResult, "fetching landing page hero list creator", null);
  if (!profile) return null;

  const preview: Record<Tier, { id: string; title: string; thumbnail: string | null }[]> = {
    S: [], A: [], B: [], C: [], D: [], F: [], unranked: [],
  };
  for (const item of items ?? []) {
    preview[item.tier].push({
      id: item.books.id,
      title: item.books.title,
      thumbnail: item.books.thumbnail_url,
    });
  }

  return { list, profile, preview };
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A marketing page has nothing left to say to someone already signed in —
  // every real product sends them straight into the app instead. (Used to
  // render the same hero with a "Go to profile" button in that case; this
  // is a clearer, more standard pattern.)
  if (user) {
    redirect("/explore");
  }

  const hero = await getHeroList(supabase);

  // Real matches too — same founder account the hero list belongs to, so
  // "How it works" and "Matching" show the actual person's actual data
  // rather than invented readers.
  // No `limit` — getTopMatches already computes every candidate regardless
  // (limit only slices the final sorted list, see its own comment), and the
  // three named accounts below aren't necessarily in the overall top few by
  // match %, so the full sorted list is what's needed to reliably find them.
  const allMatches = hero ? await getTopMatches(supabase, hero.list.user_id) : [];

  // Still the algorithmic 2nd-best match — a separate, earlier request
  // ("show the compare page ... test_reader_eight") from the three named
  // accounts above, so it's deliberately not tied to MATCH_USERNAMES.
  const secondaryMatch = allMatches[1];

  // The three named profiles, in the given priority order — desktop shows
  // all of them in the Match card; mobile shows just whichever one clears
  // getFirstAvailableMatch's threshold, and that same person's real
  // recommendations fill Discover on both breakpoints.
  const matchCandidates = MATCH_USERNAMES.map((username) =>
    allMatches.find((match) => match.username === username),
  ).filter((match): match is TopMatchPerson => match !== undefined);
  const matchSource = hero
    ? await getFirstAvailableMatch(supabase, hero.list.user_id, matchCandidates)
    : null;
  const mobileMatch = matchSource?.person ?? null;
  const discover = matchSource?.recommendations ?? [];

  const recentActivity = await getRecentActivity(supabase, matchCandidates);

  // The real Compare detail page's own header (You/percentage/Them +
  // CompareStatsRow) for the founder's real secondary match — reuses the
  // exact same components the real page renders, not a re-implementation,
  // so this is genuinely "the compare page," not a lookalike.
  const compareSummary =
    hero && secondaryMatch
      ? await getComparisonSummary(supabase, hero.list.user_id, secondaryMatch.userId)
      : null;

  const comparePercentage = compareSummary?.match.percentage ?? null;
  const compareRecommendations =
    hero &&
    secondaryMatch &&
    comparePercentage !== null &&
    comparePercentage >= MIN_RECOMMENDATION_MATCH_PERCENTAGE &&
    compareSummary!.match.sharedBookCount >= MIN_RECOMMENDATION_SHARED_BOOKS
      ? await getMatchRecommendations(
          supabase,
          hero.list.user_id,
          secondaryMatch.userId,
          comparePercentage,
          4,
        )
      : [];

  // "Put the Dune recommendation under that" — show it specifically if
  // it's actually one of the real recommendations for this pairing, since
  // that's a stronger, more specific proof point than just "the first one
  // happens to be whatever it is." Falls back to the top recommendation
  // regardless of title otherwise — still real data either way.
  const compareRecommendation =
    compareRecommendations.find((r) => r.title.toLowerCase().includes("dune")) ??
    compareRecommendations[0] ??
    null;

  return (
    <main className="flex-1 bg-background">
      {/* Nav stays pinned to the top of the viewport like normal; only the
          hero content below it (headline, subhead, buttons, hero image)
          centers vertically within the remaining space, so the opening
          screen reads as one deliberate, fully-visible moment without
          leaving a gap above the nav. */}
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-5xl px-4 lg:px-6">
          <nav className="flex items-center justify-between py-5 lg:py-6">
            <Wordmark />
            <Link
              href="/login"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-5xl px-4 lg:px-6">
            <section className="grid grid-cols-1 items-center gap-10 py-2 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-10">
              <div>
                <h1
                  className="mb-5 text-[32px] leading-[1.1] font-semibold tracking-tight text-balance lg:mb-[22px] lg:text-[52px]"
                  style={serifStyle}
                >
                  Rank. <em className="text-primary-link italic">Match.</em>{" "}
                  Discover.
                </h1>
                <p className="mb-7 max-w-[46ch] text-base leading-relaxed text-muted-foreground lg:mb-[34px] lg:text-lg">
                  Build your tier list, match with readers who share your
                  taste, and discover your next favorite read.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                    Sign up →
                  </Link>
                  <Link
                    href="#how-it-works"
                    className={buttonVariants({ variant: "outline", size: "lg" })}
                  >
                    See how it works
                  </Link>
                </div>
              </div>

              {hero ? (
                // The founder's own real tier rankings and cover art — but the
                // surrounding social chrome (Follow, like/comment counts,
                // caption) is boosted/illustrative rather than this specific
                // brand-new list's real (near-zero) numbers, so the hero
                // actually sells what a popular list on the site looks like.
                // See HeroListCard's own doc comment for the full reasoning.
                <div className="rounded-sm shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)] lg:rotate-1">
                  <HeroListCard
                    title={hero.list.title}
                    caption="My all-time fantasy favorites — ranked, re-ranked, and fought about more than I'd like to admit."
                    username={hero.profile.username}
                    avatarUrl={hero.profile.avatar_url}
                    likeCount={43}
                    commentCount={18}
                    preview={hero.preview}
                  />
                </div>
              ) : (
                <MarketingTierBoard />
              )}
            </section>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 lg:px-6">
        <HowItWorks
          rankPreview={hero?.preview ?? null}
          match={mobileMatch}
          discover={discover.map((rec) => ({
            book: { id: rec.bookId, title: rec.title, thumbnail: rec.thumbnail },
            percentage: rec.matchPercentage,
          }))}
        />

        {hero && secondaryMatch && compareSummary && comparePercentage !== null && (
          <MatchingShowcase
            founder={{
              username: hero.profile.username,
              displayName: null,
              avatarUrl: hero.profile.avatar_url,
            }}
            them={{
              username: secondaryMatch.username,
              displayName: secondaryMatch.displayName,
              avatarUrl: secondaryMatch.avatarUrl,
            }}
            matchPercentage={comparePercentage}
            sharedBookCount={compareSummary.match.sharedBookCount}
            sharedFavoritesCount={compareSummary.bothLove.length}
            sharedDislikesCount={compareSummary.sharedDislikes.length}
            disagreementsCount={compareSummary.disagreeOn.length}
            topSharedGenre={compareSummary.topSharedGenre}
            recommendation={compareRecommendation}
          />
        )}

        <FriendActivity activity={recentActivity} />

        <FinalCta />

        <footer className="flex items-center justify-between border-t border-border py-7 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground" style={serifStyle}>
            Tiera
          </span>
          <span>Discover entertainment you&apos;ll actually enjoy.</span>
        </footer>
      </div>
    </main>
  );
}
