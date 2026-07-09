"use client";

import { deleteTierList } from "@/app/(app)/lists/actions";
import { Button } from "@/components/ui/button";

export function DeleteListButton({ tierListId }: { tierListId: string }) {
  async function handleDelete() {
    if (
      !window.confirm(
        "Permanently delete this list? This also removes its likes and comments. This cannot be undone.",
      )
    ) {
      return;
    }
    // Must be awaited, not fired-and-forgotten — deleteTierList's redirect()
    // works by throwing a special error that Next's client-side action
    // wrapper needs to catch off this same promise chain. Discarding the
    // promise (the previous `void deleteTierList(...)`) silently detaches
    // that signal, so the delete still happens server-side but the redirect
    // back to /profile never fires — looks like the button does nothing.
    await deleteTierList(tierListId);
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
