"use client";

import { useRef } from "react";
import { TopNav } from "@/components/top-nav";
import { ListDescription } from "./list-description";
import { ListOptionsMenu } from "./list-options-menu";
import { ReadOnlyTierBoard, type DetailedColumns } from "./read-only-board";

/**
 * Your own published list, viewed from Profile — deliberately separate
 * from ListDetailView (the visitor-facing equivalent) rather than a
 * shared component branching on isOwner, so owner-only changes here
 * (3-dot menu, no creator header, no top like/comment row — that moved
 * into CommentsSection instead, see its likeCount/isLiked props) can
 * never leak into what a visitor sees on someone else's list.
 */
export function OwnListView({
  tierListId,
  title,
  description,
  tags,
  columns,
}: {
  tierListId: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  columns: DetailedColumns;
}) {
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <TopNav
        action={
          <ListOptionsMenu
            tierListId={tierListId}
            exportRef={exportRef}
            exportFilename={`${title || "tier-list"}.png`}
          />
        }
      />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <ListDescription description={description} tags={tags} />
      </div>
      {/* Captured for Export — the title above is already shown once as
          the page's own <h1>, so it isn't repeated in here. */}
      <div
        ref={exportRef}
        className="flex flex-col gap-3 rounded-sm bg-card p-4"
      >
        <ReadOnlyTierBoard columns={columns} highQuality />
      </div>
    </>
  );
}
