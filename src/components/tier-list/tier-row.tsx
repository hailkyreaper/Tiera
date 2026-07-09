"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableBookChip } from "./sortable-book-chip";
import { TIER_BADGE_COLORS } from "@/lib/tiers";
import type { Card } from "./types";
import type { Tier } from "@/lib/tiers";

export function TierRow({ tier, cards }: { tier: Tier; cards: Card[] }) {
  const { setNodeRef } = useDroppable({ id: tier });
  const isUnranked = tier === "unranked";

  return (
    <div className={`flex gap-2 ${isUnranked ? "h-[90px]" : "h-14"}`}>
      {!isUnranked && (
        <span
          className={`flex w-11 shrink-0 items-center rounded-xs justify-center text-sm font-bold text-white ${TIER_BADGE_COLORS[tier]}`}
        >
          {tier}
        </span>
      )}
      <SortableContext
        items={cards.map((card) => card.bookId)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="flex flex-1 flex-nowrap gap-1 items-center overflow-x-auto"
        >
          {cards.length === 0 && (
            <p className="px-3 text-xs whitespace-nowrap text-muted-foreground">
              Drop books here.
            </p>
          )}
          {cards.map((card, index) => (
            <SortableBookChip
              key={card.bookId}
              bookId={card.bookId}
              title={card.title}
              thumbnail={card.thumbnail}
              showDivider={index !== 0}
              large={isUnranked}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
