import Image from "next/image";
import Link from "next/link";
import { TIERS, TIER_BADGE_COLORS, type Tier } from "@/lib/tiers";
import { cleanCoverUrl } from "@/lib/cover-url";
import { Avatar } from "@/components/avatar";
import { MatchBadge } from "@/components/match-badge";
import { buttonVariants } from "@/components/ui/button";
import type { TopMatchPerson } from "@/lib/db/top-matches";
import { cn } from "@/lib/utils";

const serifStyle = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
};

type PreviewBook = { id: string; title: string; thumbnail: string | null };
type PreviewByTier = Record<Exclude<Tier, "unranked">, PreviewBook[]>;

function MiniCover({ book }: { book: PreviewBook }) {
  return (
    <div className="aspect-[2/3] h-10 w-7 shrink-0 overflow-hidden rounded-xs">
      {book.thumbnail ? (
        <Image
          src={cleanCoverUrl(book.thumbnail)}
          alt={book.title}
          width={80}
          height={120}
          sizes="28px"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
    </div>
  );
}

// Same divided-row look as the real tier list above it (HeroListCard/
// TierRowBar's own "full-height letter cell + shared content-cell
// background + hairline dividers between rows" convention) — a
// gap-separated stack of individually-rounded rows read as a different,
// lookalike component instead of the real thing.
function TierList({
  tiers,
  rankPreview,
}: {
  tiers: readonly Exclude<Tier, "unranked">[];
  rankPreview: PreviewByTier;
}) {
  const populated = tiers.filter((tier) => rankPreview[tier].length > 0);
  return (
    <div className="flex flex-col divide-y divide-white/10 overflow-hidden rounded-xs">
      {populated.map((tier) => (
        <div key={tier} className="grid grid-cols-[24px_1fr]">
          <div
            className={cn(
              "flex items-center justify-center text-[11px] font-extrabold text-white",
              TIER_BADGE_COLORS[tier],
            )}
          >
            {tier}
          </div>
          <div className="flex gap-[3px] bg-muted p-1">
            {rankPreview[tier].slice(0, 2).map((book) => (
              <MiniCover key={book.id} book={book} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Desktop "profile style" match row per feedback: picture, then name/
// username beside it; books-ranked/shared underneath with the match score
// inline on the right — no forward chevron, unlike the real TopMatchCard
// this is modeled on (that one's built for an actual navigable list; this
// is a static marketing snapshot, so a "go to this page" affordance
// doesn't belong here).
function MatchProfileRow({ person }: { person: TopMatchPerson }) {
  return (
    <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <Avatar
          src={person.avatarUrl}
          name={person.username}
          imageSize={40}
          sizeClassName="size-10"
          textClassName="text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {person.displayName ?? `@${person.username}`}
          </p>
          {person.displayName && (
            <p className="truncate text-xs text-muted-foreground">
              @{person.username}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {person.booksRankedCount} books ranked · {person.sharedBookCount} shared
        </span>
        <MatchBadge percentage={person.matchPercentage} className="shrink-0" />
      </div>
    </div>
  );
}

// Mobile's own row: Follow sits inline with the name (top row), and the
// match score is shrunk down to a small inline chip instead of the
// desktop row's full-size badge — both per feedback.
function MobileMatchRow({ person }: { person: TopMatchPerson }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Avatar
          src={person.avatarUrl}
          name={person.username}
          imageSize={40}
          sizeClassName="size-10"
          textClassName="text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {person.displayName ?? `@${person.username}`}
          </p>
          {person.displayName && (
            <p className="truncate text-xs text-muted-foreground">
              @{person.username}
            </p>
          )}
        </div>
        <Link
          href="/signup"
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          Follow
        </Link>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {person.booksRankedCount} books ranked · {person.sharedBookCount} shared
        </span>
        <MatchBadge
          percentage={person.matchPercentage}
          className="shrink-0 px-2 py-0.5 text-[10px]"
        />
      </div>
    </div>
  );
}

function DiscoverRow({ book, percentage }: { book: PreviewBook; percentage: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <MiniCover book={book} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{book.title}</p>
        <MatchBadge percentage={percentage} className="mt-1 px-2 py-0.5 text-[10px]" />
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  body,
  children,
}: {
  number: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 lg:h-full lg:flex-col lg:gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 font-mono text-[13px] font-bold text-white lg:mx-auto">
        {number}
      </div>
      <div className="flex-1 lg:flex lg:h-full lg:flex-col">
        <p className="mb-1.5 text-lg font-bold lg:text-center" style={serifStyle}>
          {title}
        </p>
        <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground lg:text-center">
          {body}
        </p>
        <div className="flex flex-1 flex-col justify-center rounded-sm bg-card p-3 text-left">
          {children}
        </div>
      </div>
    </div>
  );
}

const MOBILE_TIERS = ["S", "F"] as const;
const RANKED_TIERS = TIERS.filter((tier) => tier !== "unranked") as Exclude<Tier, "unranked">[];

export function HowItWorks({
  rankPreview,
  desktopMatches,
  mobileMatch,
  desktopDiscover,
  mobileDiscover,
}: {
  rankPreview: PreviewByTier | null;
  desktopMatches: TopMatchPerson[];
  mobileMatch: TopMatchPerson | null;
  desktopDiscover: { book: PreviewBook; percentage: number }[];
  mobileDiscover: { book: PreviewBook; percentage: number }[];
}) {
  return (
    <section id="how-it-works" className="py-11 lg:py-[76px]">
      <p className="mb-8 font-mono text-xs tracking-wider text-muted-foreground uppercase lg:mb-12">
        How it works
      </p>

      <div className="relative grid grid-cols-1 gap-9 lg:grid-cols-3 lg:items-stretch lg:gap-10">
        {/* Mobile-only connecting line down the left edge, behind the
            numbered badges — same plain neutral treatment as the number
            badges themselves, not the tier-color gradient this used to be.
            Desktop has no line (see Step's centered, no-line layout).
            Positioned against this grid directly (not the section above
            it) so it lines up with the badges regardless of what's above. */}
        <div className="absolute top-1.5 bottom-1.5 left-[17px] w-0.5 bg-white/15 lg:hidden" />

        <Step number="01" title="Rank" body="Rank the books you've read from S to F.">
          {rankPreview && (
            <>
              <div className="lg:hidden">
                <TierList tiers={MOBILE_TIERS} rankPreview={rankPreview} />
              </div>
              <div className="hidden lg:block">
                <TierList tiers={RANKED_TIERS} rankPreview={rankPreview} />
              </div>
            </>
          )}
        </Step>

        <Step number="02" title="Match" body="Match with readers who share your taste.">
          {desktopMatches.length === 0 && !mobileMatch && (
            <p className="text-[11px] text-muted-foreground">
              Your real match % shows up here once you&apos;ve both ranked a
              few of the same books.
            </p>
          )}
          {/* Mobile: one profile, its own Follow-inline layout. Desktop: as
              many real matches as we have (up to 3), stacked to fill the
              same height as the complete Rank list beside it. */}
          {mobileMatch && (
            <div className="lg:hidden">
              <MobileMatchRow person={mobileMatch} />
            </div>
          )}
          {desktopMatches.length > 0 && (
            <div className="hidden flex-col divide-y divide-border lg:flex">
              {desktopMatches.map((person) => (
                <MatchProfileRow key={person.userId} person={person} />
              ))}
            </div>
          )}
        </Step>

        <Step number="03" title="Discover" body="Follow readers whose taste matches yours.">
          {mobileDiscover.length === 0 && desktopDiscover.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Recommendations from your matches show up here.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2.5 lg:hidden">
                {mobileDiscover.slice(0, 2).map(({ book, percentage }) => (
                  <DiscoverRow key={book.id} book={book} percentage={percentage} />
                ))}
              </div>
              <div className="hidden flex-col gap-2.5 lg:flex">
                {desktopDiscover.map(({ book, percentage }) => (
                  <DiscoverRow key={book.id} book={book} percentage={percentage} />
                ))}
              </div>
            </>
          )}
        </Step>
      </div>
    </section>
  );
}
