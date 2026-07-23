import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { TIERS, type Tier } from "@/lib/tiers";
import { Avatar } from "@/components/avatar";
import { TierRowBar } from "@/components/tier-list/tier-row-bar";
import { buttonVariants } from "@/components/ui/button";

type PreviewBook = { id: string; title: string; thumbnail: string | null };

// A marketing-only variant of ExploreListCard — same visual language (same
// header row shape, same TierRowBar tier board, same rounded-sm/shadow
// card), but built to *sell* the product rather than be a literal live
// artifact of it: a Follow button (routes to signup — there's no real
// session to follow anyone from here), and boosted like/comment counts +
// a written caption in place of the real (low, single-word-title) numbers
// a brand-new account's own list actually has. The real tier rankings and
// cover art underneath are still the founder's own real list — only the
// surrounding social chrome is illustrative. Deliberately not a link into
// the real list detail page, since that page's real stats wouldn't match
// the boosted ones shown here.
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
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");

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
          <TierRowBar key={tier} tier={tier} books={preview[tier]} />
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
