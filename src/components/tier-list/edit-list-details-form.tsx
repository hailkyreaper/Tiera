"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import {
  cancelListEdit,
  savePublishStep,
  saveAsDraft,
  updateListDetails,
} from "@/app/(app)/lists/actions";
import { TierBoard } from "./tier-board";
import { ListActionsBar } from "./list-actions-bar";
import { ListTitleInput } from "./list-title-input";
import { TierRowBar } from "./tier-row-bar";
import { Button } from "@/components/ui/button";
import { TIERS, type Tier } from "@/lib/tiers";
import { exportElementAsImage } from "@/lib/export-image";
import type { Columns } from "./types";

const RANKED_TIERS = TIERS.filter(
  (tier): tier is Exclude<Tier, "unranked"> => tier !== "unranked",
);

export function EditListDetailsForm({
  tierListId,
  title,
  description,
  tags,
  isPublic,
  isNew,
  initialColumns,
}: {
  tierListId: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  isPublic: boolean;
  isNew: boolean;
  initialColumns: Columns;
}) {
  const [step, setStep] = useState<"edit" | "review">("edit");
  // Lifted out of TierBoard so the review step's preview reflects live
  // drag-and-drop edits instead of the stale server-rendered snapshot from
  // page load.
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [titleValue, setTitleValue] = useState(title);
  const [isPublicValue, setIsPublicValue] = useState(isPublic);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [includeTitleInExport, setIncludeTitleInExport] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  function buildFormData(): FormData {
    const formData = new FormData();
    formData.set("tierListId", tierListId);
    formData.set("title", titleValue);
    formData.set("description", description ?? "");
    // Tag editing is on hold for V2 — carried through unchanged so this
    // never nulls out existing values on a list that already has them.
    formData.set("tags", (tags ?? []).join(", "));
    formData.set("isPublic", isPublicValue ? "true" : "false");
    return formData;
  }

  async function handlePublish() {
    setPublishing(true);
    await savePublishStep(buildFormData());
    setPublishing(false);
    setStep("review");
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    await saveAsDraft(buildFormData());
    setSavingDraft(false);
  }

  async function handleShare() {
    setSharing(true);
    await updateListDetails(buildFormData());
    setSharing(false);
  }

  async function handleExportImage() {
    if (!previewRef.current) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportElementAsImage(
        previewRef.current,
        `${titleValue || "tier-list"}.png`,
      );
    } catch (err) {
      console.error("Export image failed:", err);
      setExportError("Couldn't generate the image — try again.");
    } finally {
      setExporting(false);
    }
  }

  if (step === "review") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center">
          <div className="flex flex-1 items-center justify-start">
            <button
              type="button"
              onClick={() => setStep("edit")}
              className="text-sm text-muted-foreground lg:text-base"
            >
              Back
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-base font-semibold text-foreground lg:text-xl">
              Review &amp; Share
            </h1>
          </div>
          <div className="flex flex-1" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase lg:text-base">
            Final list preview
          </h2>
          {/* Captured for the share-image export below. */}
          <div
            ref={previewRef}
            className="flex flex-col gap-3 rounded-sm bg-card p-4"
          >
            {includeTitleInExport && (
              <h3 className="font-semibold text-foreground lg:text-lg">{titleValue}</h3>
            )}
            <div className="flex flex-col divide-y divide-white/10 overflow-hidden">
              {RANKED_TIERS.map((tier) => (
                <TierRowBar
                  key={tier}
                  tier={tier}
                  highQuality
                  books={columns[tier].map((card) => ({
                    id: card.bookId,
                    title: card.title,
                    thumbnail: card.thumbnail,
                  }))}
                />
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-sm bg-card p-4">
          <span className="text-sm text-foreground lg:text-base">
            Include title in exported image
          </span>
          <input
            type="checkbox"
            checked={includeTitleInExport}
            onChange={(event) =>
              setIncludeTitleInExport(event.target.checked)
            }
            className="size-4 shrink-0 accent-primary"
          />
        </label>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={exporting}
          onClick={handleExportImage}
        >
          {exporting ? "Exporting..." : "Export image to share"}
        </Button>
        {exportError && (
          <p className="text-sm text-destructive">{exportError}</p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={savingDraft || sharing}
            onClick={handleSaveDraft}
          >
            {savingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={savingDraft || sharing}
            onClick={handleShare}
          >
            {sharing ? "Sharing..." : "Share"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      id="edit-list-details-form"
      action={updateListDetails}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="tierListId" value={tierListId} />
      <input type="hidden" name="description" value={description ?? ""} />
      <input type="hidden" name="tags" value={(tags ?? []).join(", ")} />

      <div className="flex flex-col gap-4">
        {/* Same flex-1-equal-thirds centering as the profile 3-stat row. */}
        <div className="flex items-center">
          <div className="flex flex-1 items-center justify-start">
            <button
              type="submit"
              formAction={cancelListEdit.bind(null, tierListId)}
              formNoValidate
              className="text-sm text-muted-foreground lg:text-base"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-base font-semibold text-foreground lg:text-xl">
              {isNew ? "Create List" : "Edit List"}
            </h1>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="text-sm font-semibold text-primary-link lg:text-base"
            >
              {publishing ? "..." : "Publish"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-sm bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[4px] bg-muted text-muted-foreground">
              <Camera className="size-5" />
            </div>
            <ListTitleInput value={titleValue} onChange={setTitleValue} />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-1">
            <label htmlFor="isPublic" className="text-sm text-foreground lg:text-base">
              Visibility
            </label>
            <select
              id="isPublic"
              name="isPublic"
              value={isPublicValue ? "true" : "false"}
              onChange={(event) =>
                setIsPublicValue(event.target.value === "true")
              }
              // text-base (not the page's usual text-sm lg:text-base scale)
              // is deliberate here: iOS Safari zooms the whole page in on
              // focus for any form control under 16px, and this is a real
              // <select> a mobile user can actually tap into edit mode —
              // unlike the plain text siblings around it (Cancel/Publish/
              // heading), which have no such behavior to guard against.
              className="border-input bg-transparent px-2.5 py-1 text-base text-foreground outline-none"
            >
              <option value="true">Public</option>
              <option value="false">Private</option>
            </select>
          </div>
        </div>
      </div>

      <TierBoard
        tierListId={tierListId}
        columns={columns}
        setColumns={setColumns}
      />
      <ListActionsBar tierListId={tierListId} isEditing />
    </form>
  );
}
