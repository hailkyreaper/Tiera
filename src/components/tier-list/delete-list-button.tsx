"use client";

import { deleteTierList } from "@/app/(app)/lists/actions";
import { Button } from "@/components/ui/button";

export function DeleteListButton({ tierListId }: { tierListId: string }) {
  function handleDelete() {
    if (
      !window.confirm(
        "Permanently delete this list? This also removes its likes and comments. This cannot be undone.",
      )
    ) {
      return;
    }
    void deleteTierList(tierListId);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive"
      onClick={handleDelete}
    >
      Delete list
    </Button>
  );
}
