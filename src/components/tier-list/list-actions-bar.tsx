import Link from "next/link";
import { Search, Library } from "lucide-react";
import { saveAndGoToLibrary, saveAndGoToSearch } from "@/app/(app)/lists/actions";
import { ImportDrawer } from "./import-drawer";

const linkClassName =
  "flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-foreground hover:bg-muted";

export function ListActionsBar({
  tierListId,
  isEditing = false,
}: {
  tierListId: string;
  /** In edit mode, title/visibility live in unsaved client state — these
   * two buttons must save first or that state is lost on navigation
   * (see saveAndGoToSearch/saveAndGoToLibrary). Only meaningful if this
   * bar is rendered inside the edit form, so the save has fields to read. */
  isEditing?: boolean;
}) {
  return (
    <div className="flex divide-x divide-border overflow-hidden rounded-sm bg-card">
      {isEditing ? (
        <button
          type="submit"
          formAction={saveAndGoToSearch}
          formNoValidate
          className={linkClassName}
        >
          <Search className="size-4" />
          Search Books
        </button>
      ) : (
        <Link href={`/lists/${tierListId}/search`} className={linkClassName}>
          <Search className="size-4" />
          Search Books
        </Link>
      )}

      <ImportDrawer tierListId={tierListId} isEditing={isEditing} />

      {isEditing ? (
        <button
          type="submit"
          formAction={saveAndGoToLibrary}
          formNoValidate
          className={linkClassName}
        >
          <Library className="size-4" />
          Add from Library
        </button>
      ) : (
        <Link href={`/lists/${tierListId}/library`} className={linkClassName}>
          <Library className="size-4" />
          Add from Library
        </Link>
      )}
    </div>
  );
}
