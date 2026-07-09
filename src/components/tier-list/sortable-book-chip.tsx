"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableBookChip({
  bookId,
  title,
  thumbnail,
}: {
  bookId: string;
  title: string;
  thumbnail: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      // 2:3 matches typical book cover proportions (taller than the previous
      // ~11:14/32:45 boxes), so object-cover only trims ~5% off a cover's
      // height instead of ~20% — same ratio for both sizes, "large" only
      // changes the grid's column count (via the parent), not this shape.
      className="relative aspect-[2/3] w-full cursor-grab touch-none overflow-hidden rounded-xs active:cursor-grabbing"
    >
      {thumbnail ? (
        <Image src={thumbnail} alt={title} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          {title[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}
