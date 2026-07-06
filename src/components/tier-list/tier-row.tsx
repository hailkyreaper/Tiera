"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableBookCard } from "./sortable-book-card";
import type { Card } from "./types";
import type { Tier } from "@/lib/tiers";

export function TierRow({ tier, cards }: { tier: Tier; cards: Card[] }) {
  const { setNodeRef } = useDroppable({ id: tier });

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase">
        {tier === "unranked" ? "Unranked" : `Tier ${tier}`}
      </h2>
      <SortableContext
        items={cards.map((card) => card.bookId)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="flex min-h-24 flex-wrap gap-3 rounded-2xl bg-card p-3"
        >
          {cards.length === 0 && (
            <p className="text-xs text-muted-foreground">Drop books here.</p>
          )}
          {cards.map((card) => (
            <SortableBookCard
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
