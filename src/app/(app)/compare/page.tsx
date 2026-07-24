import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTopMatches, getOtherUserCount, curateTopMatches } from "@/lib/db/top-matches";
import { TasteScoreCard } from "@/components/taste-score-card";
import { TopMatchCard } from "@/components/top-match-card";
import { CompareTabs } from "@/components/compare-tabs";
import { InfoPopover } from "@/components/info-popover";

// Just two tabs — "top" (curated best matches) and "friends" — per direct
// feedback; an "All Matches" third tab and a sort/filter control were both
// tried and dropped as unnecessary.
type Tab = "top" | "friends";

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
  searchParams: Promise<{ tab?: string; expanded?: string }>;
}) {
  const { tab: rawTab, expanded: rawExpanded } = await searchParams;
  const tab: Tab = rawTab === "friends" ? "friends" : "top";
  // "Top Matches" shows 10 by default, 15 once expanded — never the true
  // full list (see curateTopMatches).
  const expanded = rawExpanded === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Always compute the full list — it drives the taste-score card up top
  // regardless of which tab is active, and is also what rank badges are
  // always computed against (see rankByUserId below).
  const [allMatches, otherUserCount] = await Promise.all([
    getTopMatches(supabase, user.id),
    getOtherUserCount(supabase, user.id),
  ]);

  // Friends is people you already know/follow, shown as-is (uncurated) —
  // the point there is "compare with people I know," not "discover new
  // people."
  const friendsMatches =
    tab === "friends"
      ? await getTopMatches(supabase, user.id, { followingOnly: true })
      : [];

  // Rank badges always reflect a person's position in the *full* Best
  // Match ranking (allMatches), never the currently-viewed pool's own
  // ordering — so a friend shows their real overall standing on the
  // Friends tab too, not just "1st, 2nd, 3rd among your friends."
  const rankByUserId = new Map(allMatches.map((person, i) => [person.userId, i + 1]));

  const matches =
    tab === "friends" ? friendsMatches : curateTopMatches(allMatches, { expanded });
  const hasMore = tab === "top" && !expanded && allMatches.length > matches.length;

  const bestMatch = allMatches[0]?.matchPercentage ?? null;
  const matchedUserPercentage =
    otherUserCount > 0
      ? Math.round((allMatches.length / otherUserCount) * 100)
      : 0;

  return (
    <div className="flex w-full flex-1 gap-6 p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 xl:max-w-4xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Compare
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Find people who match your taste in books.
            </p>
          </div>
          {bestMatch !== null && (
            <InfoPopover>
              <p className="font-medium text-foreground">{bestMatch}%</p>
              <p className="mt-1">
                Your single highest taste match with anyone on Tiera — how
                well your top match&apos;s book ratings line up with yours.
              </p>
              <p className="mt-2 font-medium text-foreground">
                {matchedUserPercentage}% of users
              </p>
              <p className="mt-1">
                How many people on Tiera share enough ranked books with you
                (3+) to even calculate a match percentage for.
              </p>
            </InfoPopover>
          )}
        </div>

        {bestMatch !== null && (
          <TasteScoreCard
            bestMatchPercentage={bestMatch}
            matchedUserPercentage={matchedUserPercentage}
          />
        )}

        <CompareTabs
          basePath="/compare"
          paramName="tab"
          tabs={[
            { value: "top", label: "Top Matches" },
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
              : otherUserCount === 0
                ? "No one else has joined Tiera yet — once other readers sign up and rank a few books, matches will start showing up here."
                : "Not enough shared books with anyone yet — rank more books to see matches here."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((person) => (
              <TopMatchCard
                key={person.userId}
                person={person}
                rank={rankByUserId.get(person.userId) ?? 1}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <Link
            href="/compare?tab=top&expanded=true"
            className="pb-1 text-center text-sm font-semibold text-primary-link"
          >
            View more
          </Link>
        )}
      </div>
    </div>
  );
}
