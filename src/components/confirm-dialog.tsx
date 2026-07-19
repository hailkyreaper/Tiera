"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// In-app-styled replacement for window.confirm() — same Base UI family
// (Drawer/Popover/Menu) already used everywhere else in this app for
// overlay UI, so a destructive-action confirmation doesn't look like a
// jarring native browser dialog dropped into an otherwise fully themed
// app. Controlled (open/onOpenChange), not Trigger-driven, since the
// action that should prompt a confirmation (e.g. a "Delete" button) is
// already its own thing elsewhere in the tree, not naturally the same
// element as this dialog's trigger.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialog.Popup className="w-full max-w-sm rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <AlertDialog.Title className="text-base font-semibold text-foreground">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Close
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                {cancelLabel}
              </AlertDialog.Close>
              <button
                type="button"
                className={cn(
                  buttonVariants({
                    variant: destructive ? "destructive" : "default",
                    size: "sm",
                  }),
                )}
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
