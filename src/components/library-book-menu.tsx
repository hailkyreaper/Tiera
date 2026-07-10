"use client";

import { useTransition } from "react";
import { Menu } from "@base-ui/react/menu";
import { MoreVertical } from "lucide-react";
import { removeFromLibrary } from "@/app/(app)/profile/actions";

export function LibraryBookMenu({ bookId }: { bookId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Book options"
        className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MoreVertical className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end">
          <Menu.Popup className="min-w-40 rounded-xl bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <Menu.Item
              disabled={isPending}
              onClick={() => startTransition(() => removeFromLibrary(bookId))}
              className="cursor-pointer rounded-lg px-3 py-2 text-destructive data-[highlighted]:bg-destructive/10 data-[disabled]:opacity-50"
            >
              Remove from Library
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
