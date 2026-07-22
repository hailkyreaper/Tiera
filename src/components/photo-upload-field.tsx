"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared "pick a photo, see exactly what you picked before continuing"
 * field — both the AI photo import form and the profile picture field
 * previously only showed a filename (or, for the profile picture, showed
 * literally nothing at all — that field was plain server-rendered markup
 * with no client state), which left it genuinely ambiguous whether a tap
 * on "Upload" had done anything before committing to the next step
 * (Identify Books / Save). A real thumbnail preview plus an explicit
 * "Selected" confirmation is a much stronger signal than text alone,
 * especially for a photo field where seeing the actual image matters.
 */
export function PhotoUploadField({
  id,
  name,
  label,
  accept = "image/*",
  capture,
  existingImageUrl,
  fallbackInitial,
  previewShape = "square",
  onFileSelected,
}: {
  id: string;
  name: string;
  label: string;
  accept?: string;
  capture?: "user" | "environment";
  /** Shown as the preview before anything new is picked (e.g. the current
   * avatar) — irrelevant for a one-shot field like AI photo import, which
   * omits it. */
  existingImageUrl?: string | null;
  /** Fallback initial shown in place of a preview when there's neither an
   * existing image nor a new selection yet. */
  fallbackInitial?: string;
  previewShape?: "square" | "circle";
  /** Optional — lets a caller (AI photo import) react to the raw File
   * itself (it compresses oversized photos before upload), not just rely
   * on the field's own hidden input for FormData. */
  onFileSelected?: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPreviewUrl(url);
      setFileName(file.name);
    } else {
      setPreviewUrl(null);
      setFileName(null);
    }

    onFileSelected?.(file);
  }

  const displayUrl = previewUrl ?? existingImageUrl ?? null;
  const isNewSelection = previewUrl !== null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative size-14 shrink-0 overflow-hidden bg-muted",
            previewShape === "circle" ? "rounded-full" : "rounded-sm",
          )}
        >
          {displayUrl ? (
            <Image src={displayUrl} alt="" fill className="object-cover" />
          ) : (
            fallbackInitial && (
              <div className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {fallbackInitial}
              </div>
            )
          )}
          {isNewSelection && (
            <div className="absolute right-0 bottom-0 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
              <Check className="size-2.5" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label
            htmlFor={id}
            className="inline-flex h-8 w-full max-w-48 cursor-pointer items-center justify-center rounded-sm bg-muted px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            {isNewSelection ? "Change photo" : "Upload"}
          </label>
          {isNewSelection && fileName && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Check className="size-3 shrink-0 text-primary" />
              <span className="truncate">{fileName} selected</span>
            </p>
          )}
        </div>
      </div>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        capture={capture}
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}
