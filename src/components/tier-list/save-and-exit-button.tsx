"use client";

import { Button } from "@/components/ui/button";
import { finishManagingList } from "@/app/(app)/lists/actions";

export function SaveAndExitButton() {
  async function handleClick() {
    // Must be awaited — redirect() relies on this promise chain, discarding
    // it (fire-and-forget) silently drops the navigation.
    await finishManagingList();
  }

  return (
    <Button type="button" size="sm" onClick={handleClick}>
      Save
    </Button>
  );
}
