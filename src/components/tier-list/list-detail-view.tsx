"use client";

import { useRef } from "react";
import { TopNav } from "@/components/top-nav";
import { ListCreatorHeader } from "./list-creator-header";
import { ListDescription } from "./list-description";
import { ListOptionsMenu } from "./list-options-menu";
import { FollowButton } from "@/components/follow-button";
import { ReadOnlyTierBoard, type DetailedColumns } from "./read-only-board";

/**
 * The "viewing a finished list" experience — used identically whether
 * you're looking at your own published list from Profile or someone
 * else's. Differs by isOwner in two ways: TopNav gets a 3-dot options
 * menu (Export/Edit/Delete) instead of nothing, and the creator header
 * (avatar/username/posted-time) is skipped entirely — redundant on your
 * own list, but still shown as before for a visitor, who it's actually
 * useful to. Like count moved out of here entirely — it now sits next to
 * the comment count in CommentsSection instead (see the caller in
 * lists/[id]/page.tsx). Holds the export ref itself so the menu (up in
 * TopNav) and the capturable board (further down) can share it.
 */
export function ListDetailView({
  tierListId,
  title,
  description,
  tags,
  creatorUsername,
  creatorAvatarUrl,
  createdAt,
  isOwner,
  targetUserId,
  isFollowing,
  showFollow,
  matchPercentage,
  columns,
}: {
  tierListId: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  createdAt: string;
  isOwner: boolean;
  targetUserId: string;
  isFollowing: boolean;
  showFollow: boolean;
  matchPercentage: number | null;
  columns: DetailedColumns;
}) {
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <TopNav
        action={
          isOwner ? (
            <ListOptionsMenu
              tierListId={tierListId}
              exportRef={exportRef}
              exportFilename={`${title || "tier-list"}.png`}
            />
          ) : undefined
        }
      />
      {!isOwner && (
        <ListCreatorHeader
          username={creatorUsername}
          avatarUrl={creatorAvatarUrl}
          createdAt={createdAt}
          action={
            showFollow ? (
              <FollowButton
                targetUserId={targetUserId}
                username={creatorUsername}
                isFollowing={isFollowing}
              />
            ) : undefined
          }
        />
      )}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <ListDescription description={description} tags={tags} />
      </div>
      {matchPercentage !== null && (
        <span className="text-xs font-semibold text-primary">
          {matchPercentage}% match
        </span>
      )}
      {/* Captured for Export — only this block, matching the create flow's
          review-step export scope (title + tier board, not the header/
          likes/comments around it). */}
      <div
        ref={exportRef}
        className="flex flex-col gap-3 rounded-sm bg-card p-4"
      >
        <h3 className="font-semibold text-foreground">{title}</h3>
        <ReadOnlyTierBoard columns={columns} highQuality />
      </div>
    </>
  );
}
