"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { removeFromLibrary } from "@/app/lists/actions";
import { Button } from "@/components/ui/button";
import { SortableBookCard } from "./sortable-book-card";
import type { Card } from "./types";

export function LibraryRow({ cards }: { cards: Card[] }) {
  const { setNodeRef } = useDroppable({ id: "library" });

  function handleRemove(card: Card) {
    if (
      !window.confirm(
        `Permanently remove "${card.title}" from your library? This also removes it from any tier lists it's ranked in.`,
      )
    ) {
      return;
    }
    void removeFromLibrary(card.bookId);
  }

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
          <div key={card.bookId} className="flex flex-col gap-1">
            <SortableBookCard
              bookId={card.bookId}
              title={card.title}
              thumbnail={card.thumbnail}
            />
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="text-destructive"
              onClick={() => handleRemove(card)}
            >
              Remove from library
            </Button>
          </div>
        ))}
      </div>
    </SortableContext>
  );
}
