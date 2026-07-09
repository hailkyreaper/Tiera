"use client";

import { useEffect, useRef, useState } from "react";
import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Image from "next/image";
import {
  addBookToTier,
  moveBookToTier,
  removeBookFromList,
  reorderTierItems,
} from "@/app/(app)/lists/actions";
import { TIERS } from "@/lib/tiers";
import { TierRow } from "./tier-row";
import { TrashDropZone } from "./trash-drop-zone";
import type { Card, Columns, ContainerId } from "./types";

const CONTAINERS: ContainerId[] = [...TIERS];

// Unranked chips (90px) are noticeably bigger than ranked-tier rows (56px),
// which throws off plain closestCenter: it compares the dragged rect's own
// center to each row's center, and a taller dragged rect's center doesn't
// line up with the cursor the way a same-sized one would — some rows become
// hard to land on. Preferring pointerWithin (did the cursor actually enter
// this row?) and only falling back to closestCenter when the pointer isn't
// over anything fixes that; this is dnd-kit's own recommended pattern for
// mixed-size multi-container drag targets.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

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

    if (String(over.id) === "trash") {
      const card = columns[startContainer].find(
        (c) => c.bookId === active.id,
      );
      setColumns((prev) => ({
        ...prev,
        [startContainer]: prev[startContainer].filter(
          (c) => c.bookId !== active.id,
        ),
      }));
      if (card?.itemId) {
        await removeBookFromList(card.itemId, tierListId);
      }
      return;
    }

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

  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col divide-y divide-white/10 overflow-hidden rounded-sm bg-card p-2">
        {rankedTiers.map((tier) => (
          <TierRow key={tier} tier={tier} cards={columns[tier]} />
        ))}
      </div>

      <div className="flex flex-col gap-2 overflow-hidden rounded-sm bg-card p-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">
          Unranked Books ({columns.unranked.length})
        </h2>
        <TierRow tier="unranked" cards={columns.unranked} />
      </div>

      {activeCard && <TrashDropZone />}

      <DragOverlay>
        {activeCard && (
          <div
            className={`relative overflow-hidden rounded-[4px] ${
              startContainerRef.current === "unranked"
                ? "h-[100px] w-[71px]"
                : "h-[58px] w-[46px]"
            }`}
          >
            {activeCard.thumbnail ? (
              <Image
                src={activeCard.thumbnail}
                alt={activeCard.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                {activeCard.title[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
