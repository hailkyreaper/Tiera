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
      className="w-full cursor-grab touch-none overflow-hidden rounded-xs active:cursor-grabbing"
    >
      {thumbnail ? (
        // width/height here are just a sizing hint for Next's placeholder —
        // h-auto/w-full renders at the cover's own real aspect ratio, so
        // every cover keeps the same width but its full, uncropped height
        // instead of being fit into (and letterboxed/cropped by) a fixed box.
        <Image
          src={thumbnail}
          alt={title}
          width={400}
          height={600}
          className="h-auto w-full"
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          {title[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}
