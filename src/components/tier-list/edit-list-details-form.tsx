import { Camera } from "lucide-react";
import {
  cancelListEdit,
  saveAsDraft,
  updateListDetails,
} from "@/app/(app)/lists/actions";
import { ListTitleInput } from "./list-title-input";

export function EditListDetailsForm({
  tierListId,
  title,
  description,
  tags,
  isPublic,
  isNew,
  children,
}: {
  tierListId: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  isPublic: boolean;
  isNew: boolean;
  /** TierBoard + ListActionsBar, rendered inside this same <form> so the
   * action bar's Search/Library buttons can save title/visibility before
   * navigating away — see ListActionsBar's isEditing prop. */
  children?: React.ReactNode;
}) {
  return (
    <form
      id="edit-list-details-form"
      action={updateListDetails}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="tierListId" value={tierListId} />

      <div className="flex flex-col gap-4">
        {/* Same flex-1-equal-thirds centering as the profile 3-stat row —
            justify-between on unequal-width children (Cancel vs. Draft+Save)
            never actually centers the title on the row's true center, only
            equal-width columns each centering their own content do. */}
        <div className="flex items-center">
          <div className="flex flex-1 items-center justify-start">
            <button
              type="submit"
              formAction={cancelListEdit.bind(null, tierListId)}
              formNoValidate
              className="text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-base font-semibold text-foreground">
              {isNew ? "Create List" : "Edit List"}
            </h1>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <button
              type="submit"
              formAction={saveAsDraft}
              formNoValidate
              className="text-sm text-muted-foreground"
            >
              Draft
            </button>
            <button
              type="submit"
              className="text-sm font-semibold text-primary"
            >
              Save
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-sm bg-card p-2">
          <div className="flex items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[4px] bg-muted text-muted-foreground">
              <Camera className="size-5" />
            </div>
            <ListTitleInput defaultValue={title} />
          </div>

          {/* Description/Tags editing is removed for now — coming back in a
              later update. Carried through as hidden fields so Save doesn't
              null out existing values on lists that already have them. */}
          <input type="hidden" name="description" value={description ?? ""} />
          <input type="hidden" name="tags" value={(tags ?? []).join(", ")} />

          <div className="flex items-center justify-between border-t border-border pt-1">
            <label htmlFor="isPublic" className="text-sm text-foreground">
              Visibility
            </label>
            <select
              id="isPublic"
              name="isPublic"
              defaultValue={isPublic ? "true" : "false"}
              className=" border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none"
            >
              <option value="true">Public</option>
              <option value="false">Private</option>
            </select>
          </div>
        </div>
      </div>

      {children}
    </form>
  );
}
