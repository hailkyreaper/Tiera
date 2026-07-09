"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableBookChip({
  bookId,
  title,
  thumbnail,
  large,
}: {
  bookId: string;
  title: string;
  thumbnail: string | null;
  /** Unranked books render bigger since there's no title text next to them
   * to identify a cover by — once dragged into a ranked tier, they shrink
   * back to the standard chip size. */
  large?: boolean;
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
      className={`relative shrink-0 cursor-grab touch-none overflow-hidden rounded-xs active:cursor-grabbing ${
        large ? "h-[90px] w-16" : "h-14 w-11"
      }`}
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
