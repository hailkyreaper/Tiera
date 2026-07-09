import { Camera } from "lucide-react";
import { cancelListEdit, updateListDetails } from "@/app/(app)/lists/actions";
import { ListTitleInput } from "./list-title-input";

export function EditListDetailsForm({
  tierListId,
  title,
  description,
  tags,
  isPublic,
  isNew,
}: {
  tierListId: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  isPublic: boolean;
  isNew: boolean;
}) {
  return (
    <form action={updateListDetails} className="flex flex-col gap-4">
      <input type="hidden" name="tierListId" value={tierListId} />

      <div className="flex items-center justify-between">
        <button
          type="submit"
          formAction={cancelListEdit.bind(null, tierListId)}
          formNoValidate
          className="text-sm text-muted-foreground"
        >
          Cancel
        </button>
        <h1 className="text-base font-semibold text-foreground">
          {isNew ? "Create List" : "Edit List"}
        </h1>
        <button type="submit" className="text-sm font-semibold text-primary">
          Save
        </button>
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
    </form>
  );
}
