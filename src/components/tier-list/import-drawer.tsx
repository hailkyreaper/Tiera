"use client";

import Link from "next/link";
import { Drawer } from "@base-ui/react/drawer";
import { Download, BookText, Sparkles } from "lucide-react";
import {
  saveAndGoToGoodreadsImport,
  saveAndGoToAiImport,
} from "@/app/(app)/lists/actions";

export function ImportDrawer({
  tierListId,
  isEditing = false,
}: {
  tierListId: string;
  isEditing?: boolean;
}) {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-foreground hover:bg-muted">
        <Download className="size-4" />
        Import
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup className="flex h-[45vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-card outline-none transition-transform duration-300 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
            <Drawer.Content className="flex flex-col gap-3 p-6">
              <Drawer.Title className="text-lg font-semibold text-foreground">
                Import books
              </Drawer.Title>

              {isEditing ? (
                <button
                  type="submit"
                  form="edit-list-details-form"
                  formAction={saveAndGoToGoodreadsImport}
                  formNoValidate
                  className="flex items-center gap-3 rounded-sm bg-muted p-4 text-left hover:bg-muted/70"
                >
                  <BookText className="size-5 shrink-0 text-primary" />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Import from Goodreads
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Upload your Goodreads export CSV
                    </span>
                  </span>
                </button>
              ) : (
                <Link
                  href={`/lists/${tierListId}/import/goodreads`}
                  className="flex items-center gap-3 rounded-sm bg-muted p-4 text-left hover:bg-muted/70"
                >
                  <BookText className="size-5 shrink-0 text-primary" />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Import from Goodreads
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Upload your Goodreads export CSV
                    </span>
                  </span>
                </Link>
              )}

              {isEditing ? (
                <button
                  type="submit"
                  form="edit-list-details-form"
                  formAction={saveAndGoToAiImport}
                  formNoValidate
                  className="flex items-center gap-3 rounded-sm bg-muted p-4 text-left hover:bg-muted/70"
                >
                  <Sparkles className="size-5 shrink-0 text-primary" />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Import with AI
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Add books from a photo
                    </span>
                  </span>
                </button>
              ) : (
                <Link
                  href={`/lists/${tierListId}/import/ai`}
                  className="flex items-center gap-3 rounded-sm bg-muted p-4 text-left hover:bg-muted/70"
                >
                  <Sparkles className="size-5 shrink-0 text-primary" />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Import with AI
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Add books from a photo
                    </span>
                  </span>
                </Link>
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
