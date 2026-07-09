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
      // aspect-[2/3] here is a cap, not a forced box: the image itself is
      // h-auto (its own real height), so a cover close to 2:3 (most of
      // them) renders essentially at full height with nothing visibly
      // trimmed, while a rare unusually-tall/narrow outlier just gets its
      // excess clipped off the bottom by overflow-hidden — capping row
      // height instead of letting one outlier stretch the whole tier row.
      className="aspect-[2/3] w-full cursor-grab touch-none overflow-hidden rounded-xs active:cursor-grabbing"
    >
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          width={400}
          height={600}
          className="h-auto w-full"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          {title[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}
