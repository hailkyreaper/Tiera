"use client";

import { useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";

/** Only rendered while a book is actively being dragged (see TierBoard) —
 * dropping on this removes the book from the list entirely, via
 * removeBookFromList. Highlights when the drag is directly over it. */
export function TrashDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "trash" });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-14 items-center justify-center gap-2 rounded-sm border-2 border-dashed text-sm font-medium transition-colors ${
        isOver
          ? "border-destructive bg-destructive/10 text-destructive"
          : "border-border text-muted-foreground"
      }`}
    >
      <Trash2 className="size-4" />
      Drop here to remove
    </div>
  );
}
