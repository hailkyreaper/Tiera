"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableBookChip } from "./sortable-book-chip";
import { TierRowGrid } from "./tier-row-grid";
import { useIsDesktop } from "./use-is-desktop";
import type { Card } from "./types";
import type { Tier } from "@/lib/tiers";

// 6 on mobile (unchanged from before), 10 on desktop — matches
// TierRowBar's column count (the read-only preview shown on Explore/
// Profile/visitor list detail), so the same list doesn't look meaningfully
// more "zoomed in" while editing on desktop than everywhere else it's
// shown. Mobile intentionally keeps its original size — nothing here
// changes below the `lg` breakpoint. Computed in JS (useIsDesktop) rather
// than a responsive Tailwind class because this number feeds a dynamically-
// computed inline style (grid-template-columns, and the tier badge's row
// span), which can't itself respond to a CSS breakpoint.
const MOBILE_COLUMNS = 6;
const DESKTOP_COLUMNS = 10;

export function TierRow({ tier, cards }: { tier: Tier; cards: Card[] }) {
  const { setNodeRef } = useDroppable({ id: tier });
  const isDesktop = useIsDesktop();
  const columns = isDesktop ? DESKTOP_COLUMNS : MOBILE_COLUMNS;

  return (
    // SortableContext just needs to be an ancestor of the sortable chips in
    // the React tree — doesn't have to wrap a specific DOM node, so it sits
    // around the whole TierRowGrid call rather than needing any special
    // placement inside it.
    <SortableContext
      items={cards.map((card) => card.bookId)}
      strategy={rectSortingStrategy}
    >
      <TierRowGrid
        ref={setNodeRef}
        tier={tier}
        columns={columns}
        itemCount={cards.length}
        gap="0.25rem"
      >
        {/* col-span-full here used to collapse the row: with the badge
         * already occupying column 1, a full-width item can't fit in row 1's
         * remaining columns, so CSS Grid's auto-placement pushed it to row 2
         * instead — leaving row 1 exactly as tall as the badge's own text
         * (a "flat" colored bar) with this label rendering on its own line
         * underneath instead of inside it. Split into two pieces instead:
         * an invisible aspect-ratio cell (same technique TierRowBar uses for
         * its own empty-tier placeholder) auto-places into the first real
         * slot and gives the row real height, then the label — row-start-1
         * to force it to stay put, but only col-span-3 (not full) so it
         * still fits the remaining columns without tripping the same
         * overflow-to-next-row behavior — sits next to it on one line. */}
        {cards.length === 0 && (
          <>
            <div className="invisible aspect-[2/3] w-full" aria-hidden="true" />
            <div className="col-span-3 row-start-1 flex items-center px-2 text-xs text-muted-foreground lg:text-sm">
              Drop books here.
            </div>
          </>
        )}
        {cards.map((card) => (
          <SortableBookChip
            key={card.bookId}
            bookId={card.bookId}
            title={card.title}
            thumbnail={card.thumbnail}
          />
        ))}
      </TierRowGrid>
    </SortableContext>
  );
}
