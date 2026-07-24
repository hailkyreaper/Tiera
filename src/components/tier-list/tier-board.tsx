"use client";

import { useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
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
import { useRouter } from "next/navigation";
import {
  addBookToTier,
  moveBookToTier,
  removeBookFromList,
  reorderTierItems,
} from "@/app/(app)/lists/actions";
import { TIERS } from "@/lib/tiers";
import { cleanCoverUrl } from "@/lib/cover-url";
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
  columns,
  setColumns,
  sidebar,
}: {
  tierListId: string;
  /** Lifted into the parent (EditListDetailsForm) rather than owned here,
   * so the "final list preview" step can render the same live state
   * without going stale the moment a drag happens after page load. */
  columns: Columns;
  setColumns: Dispatch<SetStateAction<Columns>>;
  /** Opt-in (Create List only, design2): renders Unranked Books and this
   * slot together in one divided sidebar container next to the ranked
   * board, instead of Unranked stacking below it and the caller rendering
   * its own actions bar separately. Has to live inside this component's
   * own DndContext (not just visually beside it) so Unranked stays a real
   * drag-and-drop target — SortableContext/useDroppable only care about
   * React-tree ancestry, not DOM position, so moving Unranked's on-screen
   * location doesn't affect that. Omitted entirely by every other caller
   * (StandaloneTierBoard's manage view), which keeps the original stacked
   * layout with its own separately-rendered ListActionsBar underneath. */
  sidebar?: ReactNode;
}) {
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const startContainerRef = useRef<ContainerId | null>(null);
  const router = useRouter();

  // The board updates local state optimistically before these ever resolve,
  // so a rejection (in practice, only the rate limiter — a real Supabase
  // failure would already have surfaced elsewhere) would otherwise leave the
  // UI showing a move that never actually persisted, with no indication
  // anything went wrong. router.refresh() re-syncs from the server; this is
  // expected to be rare by design (the limit is tuned well above normal
  // manual drag-and-drop speed).
  async function runMutation(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (error) {
      console.error("Tier list update failed, reverting to server state:", error);
      router.refresh();
    }
  }

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
        const itemId = card.itemId;
        await runMutation(() => removeBookFromList(itemId, tierListId));
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
      const itemId = card.itemId;
      if (startContainer !== overContainer) {
        await runMutation(() => moveBookToTier(itemId, tierListId, overContainer));
      }
    } else {
      await runMutation(() => addBookToTier(tierListId, card.bookId, overContainer));
    }

    const orderedItemIds = workingColumns[overContainer]
      .map((c) => c.itemId)
      .filter((v): v is string => Boolean(v));
    if (orderedItemIds.length > 0) {
      await runMutation(() => reorderTierItems(tierListId, orderedItemIds));
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
      <div className="flex flex-col divide-y divide-white/10 overflow-hidden rounded-sm bg-card p-4">
        {rankedTiers.map((tier) => (
          <TierRow key={tier} tier={tier} cards={columns[tier]} />
        ))}
      </div>

      <div className="flex flex-col gap-2 overflow-hidden rounded-sm bg-card p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase lg:text-base">
          Unranked Books ({columns.unranked.length})
        </h2>
        <TierRow tier="unranked" cards={columns.unranked} />
      </div>

      {activeCard && <TrashDropZone />}

      <DragOverlay>
        {activeCard && (
          <div
            className={`aspect-[2/3] overflow-hidden rounded-[4px] ${
              startContainerRef.current === "unranked" ? "w-[71px]" : "w-[46px]"
            }`}
          >
            {activeCard.thumbnail ? (
              <Image
                src={cleanCoverUrl(activeCard.thumbnail)}
                alt={activeCard.title}
                width={400}
                height={600}
                sizes={
                  startContainerRef.current === "unranked" ? "71px" : "46px"
                }
                className="h-auto w-full bg-muted"
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
