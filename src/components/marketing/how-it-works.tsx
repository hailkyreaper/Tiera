import Image from "next/image";
import Link from "next/link";
import type { Tier } from "@/lib/tiers";
import { cleanCoverUrl } from "@/lib/cover-url";
import { formatRelativeTime } from "@/lib/format-time";
import { Avatar } from "@/components/avatar";
import { BookCover } from "@/components/book-cover";
import { MatchBadge } from "@/components/match-badge";
import { HeroTierRow } from "@/components/marketing/hero-list-card";
import { buttonVariants } from "@/components/ui/button";
import type { TopMatchPerson } from "@/lib/db/top-matches";
import type { ActivityItem } from "@/components/marketing/friend-activity";

const serifStyle = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
};

type PreviewBook = { id: string; title: string; thumbnail: string | null };
type PreviewByTier = Record<Exclude<Tier, "unranked">, PreviewBook[]>;

// Bigger on mobile than desktop — the landing page's Rank/Discover cards
// are full-width on mobile (same as a real Profile tier list card) but
// only a third-width column on desktop, so a size tuned to look right in
// the narrow desktop column read as noticeably smaller/less "real" than
// an actual profile row once the mobile card had the width to spare.
function MiniCover({ book }: { book: PreviewBook }) {
  return (
    <div className="aspect-[2/3] h-14 w-10 shrink-0 overflow-hidden rounded-xs lg:h-10 lg:w-7">
      {book.thumbnail ? (
        <Image
          src={cleanCoverUrl(book.thumbnail)}
          alt={book.title}
          width={80}
          height={120}
          sizes="(min-width: 1024px) 28px, 40px"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
    </div>
  );
}

// One shared row now for both breakpoints (content's identical either way
// since desktop stopped showing 3 profiles) — the match score sits inline
// with the avatar/name, right-aligned on the same row. No forward
// chevron, unlike the real TopMatchCard this is modeled on (that one's
// built for an actual navigable list; this is a static marketing
// snapshot, so a "go to this page" affordance doesn't belong here).
function MatchRow({ person }: { person: TopMatchPerson }) {
  return (
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
      <MatchBadge
        percentage={person.matchPercentage}
        className="shrink-0 px-2 py-0.5 text-[10px]"
      />
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
      {/* Routes to signup rather than the real add-to-TBR action — there's
          no real session to add a book to from a logged-out marketing
          page — but keeps the real feature's own name so it reads as a
          preview of that exact button, not an invented one. */}
      <Link
        href="/signup"
        className={buttonVariants({ size: "xs", variant: "outline" })}
      >
        Add to TBR
      </Link>
    </div>
  );
}

// Same row shape/content as FriendActivity's own activity rows (real
// person, real "ranked a new book" line, real timestamp, real cover) —
// reused here as the mobile-only Connect preview rather than the
// notification bell's follow/comment/like row, per feedback: this is the
// concrete "you'll see what people you follow are doing" moment.
function ConnectRow({ item }: { item: ActivityItem }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          src={item.avatarUrl}
          name={item.username}
          imageSize={36}
          sizeClassName="size-9"
          textClassName="text-xs"
        />
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">
            <span className="font-semibold">
              {item.displayName ?? `@${item.username}`}
            </span>{" "}
            ranked a new book
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(item.createdAt)}
          </p>
        </div>
      </div>
      <div className="w-9 shrink-0">
        <BookCover src={item.bookThumbnail} alt={item.bookTitle} size={36} />
      </div>
    </div>
  );
}

function Step({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:flex lg:h-full lg:flex-col">
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
  );
}

const MOBILE_TIERS = ["S"] as const;

// Same condensed content on both breakpoints now — one tier row, one
// match profile (with its Follow row), one recommendation, trimmed down
// so all three step cards land at the same height. Only Step's own
// row-vs-centered-column arrangement still differs per breakpoint.
export function HowItWorks({
  rankPreview,
  match,
  discover,
  connect,
}: {
  rankPreview: PreviewByTier | null;
  match: TopMatchPerson | null;
  discover: { book: PreviewBook; percentage: number }[];
  connect: ActivityItem | null;
}) {
  return (
    <section id="how-it-works" className="py-8 lg:py-12">
      <p className="mb-8 font-mono text-xs tracking-wider text-muted-foreground uppercase lg:mb-12">
        How it works
      </p>

      <div className="grid grid-cols-1 gap-9 lg:grid-cols-3 lg:items-stretch lg:gap-10">
        <Step title="Rank" body="Rank the books you've read from S to F.">
          {rankPreview && (
            <div className="flex flex-col divide-y divide-white/10 overflow-hidden rounded-xs">
              {MOBILE_TIERS.map((tier) => (
                <HeroTierRow key={tier} tier={tier} books={rankPreview[tier]} />
              ))}
            </div>
          )}
        </Step>

        <Step title="Match" body="Match with readers who share your taste.">
          {match ? (
            <MatchRow person={match} />
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Your real match % shows up here once you&apos;ve both ranked a
              few of the same books.
            </p>
          )}
        </Step>

        <Step title="Discover" body="Follow readers whose taste matches yours.">
          {discover.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Recommendations from your matches show up here.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {discover.slice(0, 1).map(({ book, percentage }) => (
                <DiscoverRow key={book.id} book={book} percentage={percentage} />
              ))}
            </div>
          )}
        </Step>

        {/* Mobile-only — covers the same "stay connected" idea desktop
            gets from Stay in the loop (hidden on mobile, see page.tsx),
            so the concept isn't dropped there, just told through a single
            real notification row instead of a whole activity list. */}
        <div className="lg:hidden">
          <Step title="Connect" body="Stay connected and interact with who you follow.">
            {connect ? (
              <ConnectRow item={connect} />
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Notifications from people you follow show up here.
              </p>
            )}
          </Step>
        </div>
      </div>
    </section>
  );
}
