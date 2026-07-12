"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableBookChip } from "./sortable-book-chip";
import { TierRowGrid } from "./tier-row-grid";
import type { Card } from "./types";
import type { Tier } from "@/lib/tiers";

const RANKED_COLUMNS = 6;
const UNRANKED_COLUMNS = 4;

export function TierRow({ tier, cards }: { tier: Tier; cards: Card[] }) {
  const { setNodeRef } = useDroppable({ id: tier });
  const isUnranked = tier === "unranked";

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
        columns={isUnranked ? UNRANKED_COLUMNS : RANKED_COLUMNS}
        itemCount={cards.length}
        gap="0.25rem"
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
      </TierRowGrid>
    </SortableContext>
  );
}
