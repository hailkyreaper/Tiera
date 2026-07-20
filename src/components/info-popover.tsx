"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";

/** Small (i) icon that reveals an explanation on tap — used wherever a
 * number or label on screen needs a bit more context than fits inline. */
export function InfoPopover({ children }: { children: React.ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="-m-2 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        aria-label="More info"
      >
        <Info className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="max-w-64 rounded-2xl bg-popover p-3 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
