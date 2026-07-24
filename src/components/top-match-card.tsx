import Link from "next/link";
import { Bookmark, BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { TopMatchPerson } from "@/lib/db/top-matches";

// Podium coloring on the rank badge: top 3 all get the brand purple (tried
// a distinct bronze/orange for 3rd, reverted to one consistent color),
// everyone else gets a neutral outline — a real distinction (top-3 vs. the
// rest), not decoration for its own sake. Rank itself is real data (list
// position), so numbering it is legitimate here, unlike a generic 01/02/03
// process marker.
function rankBadgeClass(rank: number): string {
  if (rank <= 3) return "bg-primary text-primary-foreground border-card";
  return "bg-card text-muted-foreground border-border";
}

// Redesigned per design2/"compare final.png": rank badge, avatar, name,
// match % + chevron on the same line, genre tag pills below, then a
// shared-books/unread-favorites meta line. The rank badge uses a small
// fixed radius (rounded-[7px]) rather than one of the app's card-scale
// radius tokens — every one of those (--radius-sm and up) is >= half this
// badge's box size, which renders as a full circle instead of the intended
// rounded square. Replaces the earlier avatar-inline/discoveryCount-only
// layout — this one restores topGenres (see top-matches.ts) now that
// there's an actual spot for it, and drops the previous cover-strip
// treatment entirely (not real data any more, and the simpler list reads
// cleaner per direct feedback). The name's decorative star flourish was
// tried and removed — no real feature backed it.
//
// A flush-in-the-corner treatment (matching the card's own rounded-sm
// radius, no overhang/border) was tried and reverted — user preferred
// this floating-chip look. The avatar's match-ring wrapper (a colored ring
// behind/around the profile picture itself) was also tried and removed —
// the ring stays only on the standalone match-% display elsewhere on this
// page, since that one isn't sitting on top of someone's actual photo.
export function TopMatchCard({
  person,
  rank,
}: {
  person: TopMatchPerson;
  rank: number;
}) {
  return (
    <Link
      href={`/compare/${person.username}`}
      className="relative block rounded-sm bg-card p-3.5"
    >
      <span
        className={`absolute -top-1.5 -left-1.5 z-10 flex size-6 items-center justify-center rounded-[7px] border-2 text-[11px] font-extrabold ${rankBadgeClass(rank)}`}
      >
        {rank}
      </span>

      <div className="flex items-center gap-3">
        <Avatar
          src={person.avatarUrl}
          name={person.username}
          imageSize={56}
          sizeClassName="size-14"
          textClassName="text-lg"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-bold text-foreground">
              {person.displayName ?? `@${person.username}`}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <span className="text-base font-extrabold text-primary-link">
                {person.matchPercentage}%
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </div>

          {person.topGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {person.topGenres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-border px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center pt-2 gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Bookmark className="size-3.5" />
              {person.sharedBookCount} shared
            </span>
            {person.discoveryCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                {person.discoveryCount} unread favorites
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-500">
                <CheckCircle2 className="size-3.5" />
                All favorites read
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
