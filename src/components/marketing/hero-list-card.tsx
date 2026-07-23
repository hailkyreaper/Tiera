import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { TIERS, TIER_BADGE_COLORS, type Tier } from "@/lib/tiers";
import { cleanCoverUrl } from "@/lib/cover-url";
import { Avatar } from "@/components/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewBook = { id: string; title: string; thumbnail: string | null };

// Same grid-badge structure as the real TierRowBar/TierRowGrid (badge is
// the grid's own first column, so it's always exactly as wide as one
// cover, real dividers, real "always show all 6 tiers" behavior) — but
// with its own smaller badge letter size instead of TierRowBar's fixed
// lg:text-2xl. That size assumes the real app's much wider list-detail
// cards; reused as-is here (a ~470px column, not ~770px+) it rendered
// wildly oversized relative to the covers next to it (confirmed live —
// the letter dominated the whole badge cell). Same real colors/covers/
// dividers otherwise, just scaled for this narrower card.
export function HeroTierRow({ tier, books }: { tier: Exclude<Tier, "unranked">; books: PreviewBook[] }) {
  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: "repeat(11, minmax(0, 1fr))" }}
    >
      <span
        className={cn(
          "col-start-1 flex items-center justify-center text-[11px] font-bold text-white lg:text-sm",
          TIER_BADGE_COLORS[tier],
        )}
      >
        {tier}
      </span>
      {books.length === 0 ? (
        <div className="invisible aspect-[2/3] w-full" aria-hidden="true" />
      ) : (
        books.map((book) => (
          <div key={book.id} className="aspect-[2/3] w-full overflow-hidden">
            {book.thumbnail ? (
              <Image
                src={cleanCoverUrl(book.thumbnail)}
                alt={book.title}
                width={200}
                height={300}
                sizes="(min-width: 1024px) 45px, 30px"
                className="h-auto w-full"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
        ))
      )}
    </div>
  );
}

// A marketing-only variant of ExploreListCard — same visual language (same
// header row shape, same rounded-sm/shadow card, same real tier-row
// structure/colors as TierRowBar), but built to *sell* the product rather
// than be a literal live artifact of it: a Follow button (routes to
// signup — there's no real session to follow anyone from here), and
// boosted like/comment counts + a written caption in place of the real
// (low, single-word-title) numbers a brand-new account's own list
// actually has. The real tier rankings and cover art underneath are still
// the founder's own real list — only the surrounding social chrome is
// illustrative. Deliberately not a link into the real list detail page,
// since that page's real stats wouldn't match the boosted ones shown here.
export function HeroListCard({
  title,
  caption,
  username,
  avatarUrl,
  likeCount,
  commentCount,
  preview,
}: {
  title: string;
  caption: string;
  username: string;
  avatarUrl?: string | null;
  likeCount: number;
  commentCount: number;
  preview: Record<Tier, PreviewBook[]>;
}) {
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked") as Exclude<Tier, "unranked">[];

  return (
    <div className="flex flex-col gap-3 rounded-sm bg-card p-4 lg:gap-4 lg:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar
            src={avatarUrl}
            name={username}
            imageSize={28}
            sizeClassName="size-7 lg:size-9"
            textClassName="text-xs lg:text-sm"
          />
          <span className="text-xs font-medium text-foreground lg:text-sm">
            @{username}
          </span>
        </div>
        <Link href="/signup" className={buttonVariants({ size: "sm" })}>
          Follow
        </Link>
      </div>

      <div>
        <h3 className="font-semibold lg:text-lg">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
          {caption}
        </p>
      </div>

      <div className="flex flex-col divide-y divide-white/10 overflow-hidden">
        {rankedTiers.map((tier) => (
          <HeroTierRow key={tier} tier={tier} books={preview[tier]} />
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground lg:text-sm">
        <span className="flex items-center gap-1">
          <Heart className="size-3.5 lg:size-4" /> {likeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="size-3.5 lg:size-4" /> {commentCount}
        </span>
      </div>
    </div>
  );
}
