import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getTopMatches,
  getOtherUserCount,
  curateTopMatches,
} from "@/lib/db/top-matches";
import { TasteScoreCard } from "@/components/taste-score-card";
import { TopMatchCard } from "@/components/top-match-card";
import { SegmentedTabs } from "@/components/segmented-tabs";
import { CompareSortSelect } from "@/components/compare-sort-select";

type Tab = "all" | "friends";
type Sort = "match" | "ranked";

async function goToCompare(formData: FormData) {
  "use server";
  const username = (formData.get("username") as string)?.trim();
  if (username) {
    redirect(`/compare/${username}`);
  }
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sort?: string }>;
}) {
  const { tab: rawTab, sort: rawSort } = await searchParams;
  const tab: Tab = rawTab === "friends" ? "friends" : "all";
  const sort: Sort = rawSort === "ranked" ? "ranked" : "match";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Always compute the "All" list — it drives the taste-score card up top
  // regardless of which tab is active, so switching tabs doesn't make that
  // number jump around.
  const [allMatches, otherUserCount] = await Promise.all([
    getTopMatches(supabase, user.id),
    getOtherUserCount(supabase, user.id),
  ]);

  // Friends is people you already know/follow — shown as-is regardless of
  // match quality, since the point there is "compare with people I know,"
  // not "discover new people." Curation (prefer 65%+, backfill to 5 if
  // that's thin) only applies to "All", where a low match is just noise
  // against the discovery mission.
  const unsortedMatches =
    tab === "friends"
      ? await getTopMatches(supabase, user.id, { followingOnly: true })
      : curateTopMatches(allMatches);

  // getTopMatches already returns matchPercentage-desc order — "ranked" is
  // the only real alternative sort, backed by the same booksRankedCount
  // field already fetched for the genre/favorites display, not a fabricated
  // option.
  const matches =
    sort === "ranked"
      ? [...unsortedMatches].sort(
          (a, b) => b.booksRankedCount - a.booksRankedCount,
        )
      : unsortedMatches;

  const bestMatch = allMatches[0]?.matchPercentage ?? null;
  const matchedUserPercentage =
    otherUserCount > 0
      ? Math.round((allMatches.length / otherUserCount) * 100)
      : 0;

  return (
    <div className="flex w-full flex-1 gap-6 p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 lg:max-w-3xl xl:max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Top Matches
            </h1>
            <p className="text-sm text-muted-foreground">
              People who think like you.
            </p>
          </div>
          <CompareSortSelect />
        </div>

        {bestMatch !== null && (
          <TasteScoreCard
            bestMatchPercentage={bestMatch}
            matchedUserPercentage={matchedUserPercentage}
          />
        )}

        <SegmentedTabs
          basePath="/compare"
          paramName="tab"
          tabs={[
            { value: "all", label: "All" },
            { value: "friends", label: "Friends" },
          ]}
          current={tab}
        />

        {tab === "friends" && (
          <form
            action={goToCompare}
            className="flex items-center gap-1 rounded-sm border border-input bg-transparent pr-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
          >
            <input
              name="username"
              placeholder="Search by username..."
              autoComplete="off"
              className="h-8 min-w-0 flex-1 bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex size-6 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="size-4" />
            </button>
          </form>
        )}

        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tab === "friends"
              ? "None of the people you follow have enough shared books yet."
              : "Not enough shared books with anyone yet — rank more books to see matches here."}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-sm bg-card px-4">
            {matches.map((person) => (
              <TopMatchCard key={person.userId} person={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
