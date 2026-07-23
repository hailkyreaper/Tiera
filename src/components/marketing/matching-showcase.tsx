import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BookCover } from "@/components/book-cover";
import { MatchBadge } from "@/components/match-badge";
import { CompareStatsRow } from "@/components/compare-stats-row";

const serifStyle = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
};

type Person = { username: string; displayName: string | null; avatarUrl: string | null };
type Recommendation = {
  bookId: string;
  title: string;
  authors: string[] | null;
  thumbnail: string | null;
  matchPercentage: number;
};

// The "everything above Top Books You Both Love" header of the real Compare
// detail page (src/app/(app)/compare/[username]/page.tsx) — same Avatar/
// CompareStatsRow components that page renders, not a re-implementation,
// plus one real recommendation row below it. "You" doesn't apply to an
// anonymous visitor, so both sides are labeled with their real handles
// instead. The stats grid (Shared Favorites/Dislikes/Disagreements/Genre)
// is desktop-only — mobile stays pared down to just pictures, score,
// shared-book count, and the recommendation, per feedback.
export function MatchingShowcase({
  founder,
  them,
  matchPercentage,
  sharedBookCount,
  sharedFavoritesCount,
  sharedDislikesCount,
  disagreementsCount,
  topSharedGenre,
  recommendation,
}: {
  founder: Person;
  them: Person;
  matchPercentage: number;
  sharedBookCount: number;
  sharedFavoritesCount: number;
  sharedDislikesCount: number;
  disagreementsCount: number;
  topSharedGenre: string | null;
  recommendation: Recommendation | null;
}) {
  return (
    // Offset to the left two-thirds on desktop (design2/offset.png's
    // zigzag layout, leads now — the real match % is a stronger hook than
    // the activity feed below it, which takes the right two-thirds the
    // same way) — single column on mobile, where the offset doesn't apply.
    <section className="grid grid-cols-1 py-8 lg:grid-cols-[2fr_1fr] lg:gap-12 lg:py-12">
      <div>
        <p className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Matching
        </p>
        <h2
          className="mb-4 max-w-[26ch] text-[27px] leading-[1.2] font-semibold tracking-tight text-balance lg:text-[34px]"
          style={serifStyle}
        >
          See who reads like you do.
        </h2>
        <p className="mb-8 max-w-[56ch] text-[15px] leading-relaxed text-muted-foreground lg:mb-10">
          Every match is based on books you&apos;ve both ranked—showing where
          you agree, where you disagree, and how much evidence supports your
          match.
        </p>

        <div className="flex flex-col gap-5 rounded-sm bg-card p-5 lg:p-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="flex flex-col items-center justify-center gap-2 p-1.5 text-center">
              <Avatar
                src={founder.avatarUrl}
                name={founder.username}
                imageSize={64}
                sizeClassName="size-16"
                textClassName="text-lg"
                className="ring-4 ring-primary"
              />
              <div className="flex w-full min-w-0 flex-col items-center">
                <span className="w-full truncate text-sm font-semibold text-foreground">
                  @{founder.username}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 p-1.5 text-center">
              <span className="text-4xl font-bold text-primary sm:text-5xl">
                {matchPercentage}%
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Taste Match
              </span>
              <span className="text-xs text-muted-foreground">
                {sharedBookCount} shared books
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 p-1.5 text-center">
              <Avatar
                src={them.avatarUrl}
                name={them.username}
                imageSize={64}
                sizeClassName="size-16"
                textClassName="text-lg"
                className="ring-4 ring-primary"
              />
              <div className="flex w-full min-w-0 flex-col items-center">
                {them.displayName && (
                  <span className="w-full truncate text-sm font-semibold text-foreground">
                    {them.displayName}
                  </span>
                )}
                <span
                  className={
                    them.displayName
                      ? "w-full truncate text-xs text-muted-foreground"
                      : "w-full truncate text-sm font-semibold text-foreground"
                  }
                >
                  @{them.username}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <CompareStatsRow
              sharedFavoritesCount={sharedFavoritesCount}
              sharedDislikesCount={sharedDislikesCount}
              disagreementsCount={disagreementsCount}
              topSharedGenre={topSharedGenre}
            />
          </div>

          {recommendation && (
            <div className="flex items-center gap-3 rounded-sm bg-background p-3">
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
              <Link href="/signup" className="shrink-0 text-sm font-medium text-primary-link">
                Sign up to add
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
