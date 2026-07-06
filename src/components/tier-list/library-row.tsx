"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableBookCard } from "./sortable-book-card";
import type { Card } from "./types";

export function LibraryRow({ cards }: { cards: Card[] }) {
  const { setNodeRef } = useDroppable({ id: "library" });

  return (
    <SortableContext
      items={cards.map((card) => card.bookId)}
      strategy={horizontalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className="flex min-h-24 flex-wrap gap-3 rounded-2xl p-1"
      >
        {cards.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Everything in your library has been added — drag a book here to
            remove it from the list.
          </p>
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
  );
}
