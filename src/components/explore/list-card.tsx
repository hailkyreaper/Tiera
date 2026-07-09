import Link from "next/link";
import Image from "next/image";
import { Heart, Lock, MessageCircle } from "lucide-react";
import { TIERS, type Tier } from "@/lib/tiers";
import { formatRelativeTime } from "@/lib/format-time";
import { TierRowBar } from "@/components/tier-list/tier-row-bar";

type PreviewBook = { id: string; title: string; thumbnail: string | null };

export function ExploreListCard({
  id,
  title,
  username,
  avatarUrl,
  createdAt,
  likeCount,
  commentCount,
  matchPercentage,
  isPublic,
  preview,
  fromTab,
}: {
  id: string;
  title: string;
  username: string;
  avatarUrl?: string | null;
  createdAt?: string | null;
  likeCount: number;
  commentCount: number;
  matchPercentage?: number | null;
  /** Omitted entirely on Explore, where every list is already public by
   * definition — only meaningful (and passed) on the owner's own Profile. */
  isPublic?: boolean;
  preview: Record<Tier, PreviewBook[]>;
  fromTab?: "explore" | "profile";
}) {
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl bg-card p-4 transition-colors hover:bg-muted">
      <Link
        href={fromTab ? `/lists/${id}?from=${fromTab}` : `/lists/${id}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={title}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              width={28}
              height={28}
              className="size-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {username[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <Link
            href={`/u/${username}`}
            className="relative z-10 text-xs font-medium text-foreground hover:underline"
          >
            @{username}
          </Link>
        </div>
        {createdAt && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </span>
        )}
      </div>

      <h3 className="-mt-1 flex items-center gap-1.5 font-semibold text-foreground">
        {title}
        {isPublic === false && (
          <Lock className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </h3>

      {/* gap-2 (8px) reduced 40% to 4.8px per design feedback on tier-row spacing. */}
      <div className="flex flex-col gap-[4.8px]">
        {rankedTiers.map((tier) => (
          <TierRowBar key={tier} tier={tier} books={preview[tier]} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="size-3.5" /> {likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5" /> {commentCount}
          </span>
        </div>
        {matchPercentage !== null && matchPercentage !== undefined && (
          <span className="text-xs font-semibold text-primary">
            {matchPercentage}% match
          </span>
        )}
      </div>
    </div>
  );
}
