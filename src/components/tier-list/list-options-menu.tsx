"use client";

import { useState, type RefObject } from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { MoreVertical, Download, Pencil, Trash2 } from "lucide-react";
import { deleteTierList } from "@/app/(app)/lists/actions";
import { exportElementAsImage } from "@/lib/export-image";

const itemClassName =
  "flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export function ListOptionsMenu({
  tierListId,
  exportRef,
  exportFilename,
}: {
  tierListId: string;
  /** The DOM node to capture — same export mechanism as the create flow's
   * review step (see export-image.ts). */
  exportRef: RefObject<HTMLElement | null>;
  exportFilename: string;
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      await exportElementAsImage(exportRef.current, exportFilename);
    } catch (err) {
      console.error("Export image failed:", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Permanently delete this list? This also removes its likes and comments. This cannot be undone.",
      )
    ) {
      return;
    }
    // Must be awaited — redirect() relies on this promise chain, discarding
    // it (fire-and-forget) silently drops the navigation even though the
    // delete itself still goes through server-side.
    await deleteTierList(tierListId);
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="List options"
        className="flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MoreVertical className="size-5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end">
          <Menu.Popup className="min-w-40 rounded-sm bg-popover p-1 shadow-md ring-1 ring-foreground/10">
            <Menu.Item
              disabled={exporting}
              onClick={handleExport}
              className={itemClassName}
            >
              <Download className="size-4" />
              {exporting ? "Exporting..." : "Export"}
            </Menu.Item>
            <Menu.Item
              render={<Link href={`/lists/${tierListId}?manage=true`} />}
              className={itemClassName}
            >
              <Pencil className="size-4" />
              Edit
            </Menu.Item>
            <Menu.Item
              onClick={handleDelete}
              className={`${itemClassName} text-destructive hover:text-destructive`}
            >
              <Trash2 className="size-4" />
              Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
