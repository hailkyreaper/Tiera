"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpDown, Check } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { BookDetailDrawer } from "@/components/tier-list/book-detail-drawer";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DropdownSelect } from "@/components/dropdown-select";
import { Button } from "@/components/ui/button";
import {
  clearWantToRead,
  removeBooksFromLibrary,
  reorderLibraryBooks,
} from "@/app/(app)/profile/actions";
import { cn } from "@/lib/utils";
import type { LibraryBook, LibrarySort } from "@/lib/db/library";

const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "title", label: "Title (A–Z)" },
  { value: "author", label: "Author (A–Z)" },
  { value: "rating", label: "Highest Rated" },
  { value: "custom", label: "Custom Order" },
];

// Container ids used when a list is empty (nothing to register a
// useSortable drop target of its own) — onDragOver falls back to these via
// the wrapping useDroppable zones.
const TBR_CONTAINER_ID = "tbr-container";
const LIBRARY_CONTAINER_ID = "library-container";

const triggerClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted active:bg-muted";

// One shared cover component for both TBR and Library — both are sortable
// (even TBR, which has no internal order of its own) so dnd-kit's
// "multiple containers" pattern can move an id between the two lists
// live during a drag, letting the target list's other covers actually
// shift to make room instead of the drop only taking effect at the end.
function SortableCover({
  book,
  selectMode,
  isSelected,
  sortable,
  onToggleSelected,
}: {
  book: LibraryBook;
  selectMode: boolean;
  isSelected: boolean;
  sortable: boolean;
  onToggleSelected: (bookId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: book.bookId, disabled: !sortable });

  const cover = (
    <div className={cn(isSelected && "opacity-60")}>
      <BookCover src={book.thumbnail} alt={book.title} size={100} />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...(sortable ? { ...attributes, ...listeners } : {})}
      role={selectMode ? "button" : undefined}
      tabIndex={selectMode ? 0 : undefined}
      onClick={() => selectMode && onToggleSelected(book.bookId)}
      className={cn(
        "relative",
        selectMode && "cursor-pointer",
        sortable && "cursor-grab touch-none",
        isDragging && "opacity-0",
      )}
    >
      {/* Select mode's own click-to-toggle takes over the whole cover, so
       * the detail drawer only applies outside it — a plain tap still
       * opens it even while sortable/draggable is also active, since
       * dnd-kit's activation distance means a real drag (movement past
       * the threshold) suppresses the resulting click, same composition
       * RecommendationRow already relies on. */}
      {selectMode ? (
        cover
      ) : (
        <BookDetailDrawer
          book={{
            id: book.bookId,
            title: book.title,
            thumbnail: book.thumbnail,
            description: book.description,
            authors: book.authors,
            averageRating: book.averageRating,
          }}
        >
          {cover}
        </BookDetailDrawer>
      )}
      {selectMode && (
        <span
          className={cn(
            "absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full border-2",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white/80 bg-black/30",
          )}
        >
          {isSelected && <Check className="size-3.5" />}
        </span>
      )}
    </div>
  );
}

// A plain HTML id attribute is NOT a valid dnd-kit drop target — only
// useDroppable registers one. This backs the "dropped on empty grid
// space, not directly onto another cover" fallback case for both lists.
function DroppableZone({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
}

export function LibraryTab({
  books,
  currentSort,
}: {
  books: LibraryBook[];
  currentSort: LibrarySort;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const allBooksById = new Map(books.map((book) => [book.bookId, book]));
  const bookIdsKey = books
    .map((book) => `${book.bookId}:${book.wantToRead}`)
    .join(",");

  const [tbrOrder, setTbrOrder] = useState(() =>
    books.filter((book) => book.wantToRead).map((book) => book.bookId),
  );
  const [libraryOrder, setLibraryOrder] = useState(() =>
    books.filter((book) => !book.wantToRead).map((book) => book.bookId),
  );
  // Snapshot of both lists taken at drag start — used at drag end to tell
  // whether this specific drag actually moved an item from TBR into
  // Library (vs. a plain Library-internal reorder, or a TBR drag that got
  // dropped back where it started).
  const [dragStartTbr, setDragStartTbr] = useState<string[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setTbrOrder(books.filter((book) => book.wantToRead).map((book) => book.bookId));
    setLibraryOrder(books.filter((book) => !book.wantToRead).map((book) => book.bookId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookIdsKey, currentSort]);

  const isCustomSort = currentSort === "custom";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Same pointerWithin-first fix TierBoard already uses — the wrapping
  // useDroppable zones are supersets of their own sortable items' rects, so
  // the default rectIntersection tends to resolve `over` to the outer zone
  // instead of the specific cover underneath the pointer.
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
  };

  function containerOf(id: string): "tbr" | "library" | null {
    if (tbrOrder.includes(id)) return "tbr";
    if (libraryOrder.includes(id)) return "library";
    return null;
  }

  function navigateSort(value: LibrarySort) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "library");
    if (value === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/profile?${params.toString()}`);
  }

  function toggleSelected(bookId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleDeleteConfirmed() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      await removeBooksFromLibrary(ids);
      exitSelectMode();
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setDragStartTbr(tbrOrder);
  }

  // Moves the dragged id live between the two lists as the pointer crosses
  // from one to the other — this is what makes the target list's other
  // covers actually shift to preview the insertion point, same as
  // dnd-kit's own "multiple containers" pattern. Only TBR -> Library is a
  // real feature; dragging a genuine Library book toward TBR is ignored,
  // except to let a TBR item that's already been live-moved into Library
  // snap back if the pointer returns to TBR before release.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const id = String(active.id);
    const overId = String(over.id);

    const activeContainer = containerOf(id);
    const overContainer =
      containerOf(overId) ??
      (overId === LIBRARY_CONTAINER_ID
        ? "library"
        : overId === TBR_CONTAINER_ID
          ? "tbr"
          : null);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const originallyFromTbr = dragStartTbr?.includes(id) ?? false;

    if (activeContainer === "tbr" && overContainer === "library") {
      setTbrOrder((prev) => prev.filter((bookId) => bookId !== id));
      setLibraryOrder((prev) => {
        if (prev.includes(id)) return prev;
        const overIndex = prev.indexOf(overId);
        const insertAt = overIndex === -1 ? prev.length : overIndex;
        return [...prev.slice(0, insertAt), id, ...prev.slice(insertAt)];
      });
    } else if (
      activeContainer === "library" &&
      overContainer === "tbr" &&
      originallyFromTbr
    ) {
      // Pointer came back over TBR before release — undo the live move.
      setLibraryOrder((prev) => prev.filter((bookId) => bookId !== id));
      setTbrOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const id = String(active.id);
    setActiveId(null);

    const startedInTbr = dragStartTbr?.includes(id) ?? false;
    setDragStartTbr(null);
    const endedInLibrary = libraryOrder.includes(id);

    if (startedInTbr && endedInLibrary) {
      // onDragOver already moved it live — this just confirms (or reverts)
      // the transfer at drop time, and persists the exact resulting order.
      const book = allBooksById.get(id);
      if (!book) return;
      if (
        window.confirm(
          `Mark "${book.title}" as read? This removes it from To Be Read.`,
        )
      ) {
        const finalOrder = libraryOrder;
        startTransition(async () => {
          await clearWantToRead(id);
          await reorderLibraryBooks(finalOrder);
        });
      } else {
        setLibraryOrder((prev) => prev.filter((bookId) => bookId !== id));
        setTbrOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }
      return;
    }

    if (startedInTbr) return; // Dropped back on TBR or nowhere valid.

    // Plain Library-internal reorder — only meaningful in Custom Order.
    if (!isCustomSort || !over || active.id === over.id) return;
    setLibraryOrder((prev) => {
      const oldIndex = prev.indexOf(id);
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(() => {
        reorderLibraryBooks(next);
      });
      return next;
    });
  }

  const tbrBooks = tbrOrder
    .map((id) => allBooksById.get(id))
    .filter((book): book is LibraryBook => book !== undefined);
  const orderedLibraryBooks = libraryOrder
    .map((id) => allBooksById.get(id))
    .filter((book): book is LibraryBook => book !== undefined);

  const activeBook = activeId ? allBooksById.get(activeId) : undefined;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {(tbrBooks.length > 0 || dragStartTbr) && (
          <div className="flex w-full flex-col gap-3">
            <h2 className="text-xs font-semibold text-left text-muted-foreground uppercase">
              To Be Read ({tbrBooks.length})
            </h2>
            <SortableContext items={tbrOrder} strategy={rectSortingStrategy}>
              <DroppableZone
                id={TBR_CONTAINER_ID}
                className="grid min-h-[1px] grid-cols-5 gap-3 lg:grid-cols-10"
              >
                {tbrBooks.map((book) => (
                  <SortableCover
                    key={book.bookId}
                    book={book}
                    selectMode={false}
                    isSelected={false}
                    sortable
                    onToggleSelected={() => {}}
                  />
                ))}
              </DroppableZone>
            </SortableContext>
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase">
              Library
            </h2>

            {selectMode ? (
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={exitSelectMode}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={selectedIds.size === 0 || isPending}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DropdownSelect
                  value={currentSort}
                  options={SORT_OPTIONS}
                  onChange={(value) => navigateSort(value as LibrarySort)}
                  icon={ArrowUpDown}
                />

                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className={triggerClass}
                >
                  Select
                </button>
              </div>
            )}
          </div>

          {orderedLibraryBooks.length === 0 && !dragStartTbr ? (
            <p className="text-sm text-muted-foreground">
              No books in your library yet.
            </p>
          ) : (
            <SortableContext items={libraryOrder} strategy={rectSortingStrategy}>
              <DroppableZone
                id={LIBRARY_CONTAINER_ID}
                className="grid min-h-[1px] grid-cols-5 gap-2 lg:grid-cols-10"
              >
                {orderedLibraryBooks.map((book) => (
                  <SortableCover
                    key={book.bookId}
                    book={book}
                    selectMode={selectMode}
                    isSelected={selectedIds.has(book.bookId)}
                    sortable={isCustomSort && !selectMode}
                    onToggleSelected={toggleSelected}
                  />
                ))}
              </DroppableZone>
            </SortableContext>
          )}
        </div>

        <DragOverlay>
          {activeBook ? (
            <div className="w-24 cursor-grabbing">
              <BookCover
                src={activeBook.thumbnail}
                alt={activeBook.title}
                size={100}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove from library?"
        description={`Remove ${selectedIds.size > 1 ? "these books" : "this book"} from your library? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirmed}
      />
    </>
  );
}
