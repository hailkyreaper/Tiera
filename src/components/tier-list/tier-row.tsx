"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableBookChip } from "./sortable-book-chip";
import { TIER_BADGE_COLORS } from "@/lib/tiers";
import type { Card } from "./types";
import type { Tier } from "@/lib/tiers";

export function TierRow({ tier, cards }: { tier: Tier; cards: Card[] }) {
  const { setNodeRef } = useDroppable({ id: tier });
  const isUnranked = tier === "unranked";

  return (
    // No fixed height here — once books wrap to a second (or third) row,
    // this grows to fit them, and the badge below stretches to match via
    // the default flex align-items: stretch, so the colored bar always
    // spans the full height regardless of how many rows wrapped.
    // shrink-0 on the row itself is required: without it, a flex-col
    // sibling growing taller (another tier wrapping to 2 rows) shrinks
    // every OTHER row proportionally to compensate, since flex items are
    // shrinkable by default — this is what was squeezing empty rows.
    <div className="flex shrink-0 gap-2">
      {!isUnranked && (
        <span
          className={`flex w-11 shrink-0 items-center justify-center self-stretch text-sm font-bold text-white ${TIER_BADGE_COLORS[tier]}`}
        >
          {tier}
        </span>
      )}
      <SortableContext
        items={cards.map((card) => card.bookId)}
        strategy={rectSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`grid flex-1 content-start gap-1 self-stretch ${
            isUnranked ? "grid-cols-4" : "grid-cols-6"
          }`}
        >
          {cards.length === 0 && (
            <p className="col-span-full px-3 py-4 text-xs whitespace-nowrap text-muted-foreground">
              Drop books here.
            </p>
          )}
          {cards.map((card) => (
            <SortableBookChip
              key={card.bookId}
              bookId={card.bookId}
              title={card.title}
              thumbnail={card.thumbnail}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
