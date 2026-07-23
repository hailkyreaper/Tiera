import Link from "next/link";
import { Heart, Lock, MessageCircle } from "lucide-react";
import { TIERS, type Tier } from "@/lib/tiers";
import { formatRelativeTime } from "@/lib/format-time";
import { TierRowBar } from "@/components/tier-list/tier-row-bar";
import { Avatar } from "@/components/avatar";
import { MatchBadge } from "@/components/match-badge";
import { ListCardOwnerControls } from "@/components/explore/list-card-owner-controls";
import { cn } from "@/lib/utils";

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
  isDraft,
  preview,
  fromTab,
  showOwnerControls,
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
  /** Only ever passed (and true) on the owner's own Profile — drafts never
   * show up anywhere else. Routes straight into edit mode instead of the
   * normal read view, since a draft has no finished state to show. */
  isDraft?: boolean;
  preview: Record<Tier, PreviewBook[]>;
  fromTab?: "explore" | "profile";
  /** Shows the desktop Edit + ••• toolbar next to the title (design/
   * Desktop.png) — only ever true from the owner's own Profile, never on
   * Explore or someone else's `/u/[username]`. */
  showOwnerControls?: boolean;
}) {
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");
  const href = isDraft
    ? `/lists/${id}?edit=true${fromTab ? `&from=${fromTab}` : ""}`
    : fromTab
      ? `/lists/${id}?from=${fromTab}`
      : `/lists/${id}`;

  return (
    <div className="relative flex flex-col gap-3 rounded-sm bg-card p-4 lg:gap-4 lg:p-5">
      <Link
        href={href}
        className="absolute inset-0 rounded-sm"
        aria-label={title}
      />

      {/* Redundant on the owner's own Profile at desktop — the card is
          already obviously yours (it's sitting right below your own header,
          and now also carries the Edit/••• owner controls below), same
          reasoning already applied to the dedicated list edit page's "no
          creator header" rule. Kept on mobile and everywhere else (Explore,
          `/u/[username]`) where it's the only "whose list is this" cue. */}
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          showOwnerControls && "lg:hidden",
        )}
      >
        <div className="flex items-center gap-2">
          <Avatar
            src={avatarUrl}
            name={username}
            imageSize={28}
            sizeClassName="size-7 lg:size-9"
            textClassName="text-xs lg:text-sm"
          />
          <Link
            href={`/u/${username}`}
            className="relative z-10 text-xs font-medium text-foreground hover:underline lg:text-sm"
          >
            @{username}
          </Link>
        </div>
        {createdAt && (
          <span className="shrink-0 text-xs text-muted-foreground lg:text-sm">
            {formatRelativeTime(createdAt)}
          </span>
        )}
      </div>

      <div className="-mt-1 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-semibold text-foreground lg:text-lg">
          {title}
          {isDraft ? (
            <span className="rounded-xs bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Draft
            </span>
          ) : (
            isPublic === false && (
              <Lock className="size-3.5 shrink-0 text-muted-foreground" />
            )
          )}
        </h3>
        {showOwnerControls && !isDraft && (
          <ListCardOwnerControls tierListId={id} />
        )}
      </div>

      {/* Same divide-y hairline-block style as the interactive Create List
          board (tier-board.tsx), instead of a flex gap, so both views match. */}
      <div className="flex flex-col divide-y divide-white/10 overflow-hidden">
        {rankedTiers.map((tier) => (
          <TierRowBar key={tier} tier={tier} books={preview[tier]} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground lg:text-sm">
          <span className="flex items-center gap-1">
            <Heart className="size-3.5 lg:size-4" /> {likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5 lg:size-4" /> {commentCount}
          </span>
        </div>
        {matchPercentage !== null && matchPercentage !== undefined && (
          <MatchBadge percentage={matchPercentage} />
        )}
      </div>
    </div>
  );
}
