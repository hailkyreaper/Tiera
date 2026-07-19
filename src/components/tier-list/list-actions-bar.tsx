import Link from "next/link";
import { Search, Library } from "lucide-react";
import { saveAndGoToLibrary, saveAndGoToSearch } from "@/app/(app)/lists/actions";
import { ImportDrawer } from "./import-drawer";

const BAR_ITEM_CLASS =
  "flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-foreground hover:bg-muted lg:text-sm";

// Left-aligned full-width row, meant to divide-y alongside Unranked Books
// in the same sidebar container (design2's Create List sidebar) rather
// than sit in its own separate horizontal bar.
const LIST_ITEM_CLASS =
  "flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted lg:text-base";

export function ListActionsBar({
  tierListId,
  isEditing = false,
  variant = "bar",
}: {
  tierListId: string;
  /** In edit mode, title/visibility live in unsaved client state — these
   * two buttons must save first or that state is lost on navigation
   * (see saveAndGoToSearch/saveAndGoToLibrary). Only meaningful if this
   * bar is rendered inside the edit form, so the save has fields to read. */
  isEditing?: boolean;
  /** "bar": the original horizontal 3-segment strip (manage view, unchanged).
   * "list": vertical rows sharing one divide-y container with Unranked
   * Books, for Create List's widened sidebar layout. */
  variant?: "bar" | "list";
}) {
  const itemClassName = variant === "list" ? LIST_ITEM_CLASS : BAR_ITEM_CLASS;

  return (
    <div
      className={
        variant === "list"
          ? "flex flex-col divide-y divide-border"
          : "flex divide-x divide-border overflow-hidden rounded-sm bg-card"
      }
    >
      {isEditing ? (
        <button
          type="submit"
          formAction={saveAndGoToSearch}
          formNoValidate
          className={itemClassName}
        >
          <Search className="size-4" />
          Search Books
        </button>
      ) : (
        <Link href={`/lists/${tierListId}/search`} className={itemClassName}>
          <Search className="size-4" />
          Search Books
        </Link>
      )}

      <ImportDrawer
        tierListId={tierListId}
        isEditing={isEditing}
        triggerClassName={itemClassName}
      />

      {isEditing ? (
        <button
          type="submit"
          formAction={saveAndGoToLibrary}
          formNoValidate
          className={itemClassName}
        >
          <Library className="size-4" />
          Add from Library
        </button>
      ) : (
        <Link href={`/lists/${tierListId}/library`} className={itemClassName}>
          <Library className="size-4" />
          Add from Library
        </Link>
      )}
    </div>
  );
}
