"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  addBookToTier,
  moveBookToTier,
  removeBookFromList,
  reorderTierItems,
} from "@/app/lists/actions";
import { BookCover } from "@/components/book-cover";
import { TIERS } from "@/lib/tiers";
import { TierRow } from "./tier-row";
import { LibraryRow } from "./library-row";
import type { Card, Columns, ContainerId } from "./types";

const CONTAINERS: ContainerId[] = [...TIERS, "library"];

export function TierBoard({
  tierListId,
  initialColumns,
}: {
  tierListId: string;
  initialColumns: Columns;
}) {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const startContainerRef = useRef<ContainerId | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function findContainer(id: string): ContainerId | undefined {
    if ((CONTAINERS as string[]).includes(id)) {
      return id as ContainerId;
    }
    return CONTAINERS.find((key) =>
      columns[key].some((card) => card.bookId === id),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const container = findContainer(String(event.active.id));
    if (!container) return;
    startContainerRef.current = container;
    const card = columns[container].find(
      (c) => c.bookId === event.active.id,
    );
    setActiveCard(card ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((c) => c.bookId === active.id);
      const overIndex = overItems.findIndex((c) => c.bookId === over.id);
      const card = activeItems[activeIndex];
      const newOverIndex = overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...prev,
        [activeContainer]: activeItems.filter((c) => c.bookId !== active.id),
        [overContainer]: [
          ...overItems.slice(0, newOverIndex),
          card,
          ...overItems.slice(newOverIndex),
        ],
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    const startContainer = startContainerRef.current;
    startContainerRef.current = null;
    if (!over || !startContainer) return;

    const overContainer = findContainer(String(over.id));
    if (!overContainer) return;

    let workingColumns = columns;

    if (startContainer === overContainer) {
      const items = columns[overContainer];
      const oldIndex = items.findIndex((c) => c.bookId === active.id);
      const newIndex = items.findIndex((c) => c.bookId === over.id);
      if (oldIndex !== newIndex && newIndex !== -1) {
        workingColumns = {
          ...columns,
          [overContainer]: arrayMove(items, oldIndex, newIndex),
        };
        setColumns(workingColumns);
      }
    }
    // If startContainer !== overContainer, handleDragOver already moved the
    // card into overContainer's array in state, so workingColumns already
    // reflects the final placement — nothing more to do here.

    const card = workingColumns[overContainer].find(
      (c) => c.bookId === active.id,
    );
    if (!card) return;

    if (overContainer === "library") {
      if (card.itemId) {
        await removeBookFromList(card.itemId, tierListId);
      }
      return;
    }

    if (card.itemId) {
      if (startContainer !== overContainer) {
        await moveBookToTier(card.itemId, tierListId, overContainer);
      }
    } else {
      await addBookToTier(tierListId, card.bookId, overContainer);
    }

    const orderedItemIds = workingColumns[overContainer]
      .map((c) => c.itemId)
      .filter((v): v is string => Boolean(v));
    if (orderedItemIds.length > 0) {
      await reorderTierItems(tierListId, orderedItemIds);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6">
        {TIERS.map((tier) => (
          <TierRow key={tier} tier={tier} cards={columns[tier]} />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">
          Add from your library
        </h2>
        <LibraryRow cards={columns.library} />
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="w-28">
            <BookCover
              src={activeCard.thumbnail}
              alt={activeCard.title}
              size={112}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
