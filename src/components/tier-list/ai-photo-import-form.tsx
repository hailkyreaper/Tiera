"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { bookFormFields, secureThumbnail } from "@/lib/google-books";
import type { BookFields } from "@/lib/db/books";
import {
  identifyBooksFromPhoto,
  confirmAiBooks,
  type AiCandidate,
} from "@/app/(app)/lists/[id]/import/ai/actions";

// Only kicks in for genuinely oversized photos — most phone photos land
// comfortably under this and go through completely untouched, at full
// resolution. Confirmed live that being too aggressive here directly costs
// real identifications: a packed-shelf photo (64 books, readable at full
// res in Gemini's own web UI) only identified 24 once downscaled to 2000px
// — distant/small spine text needs the detail. The 10MB budget leaves
// plenty of room before the server action's own limit (see next.config.ts),
// so this only has to compress the rare photo that's actually too big, not
// resize on principle.
const SKIP_COMPRESSION_UNDER_BYTES = 8 * 1024 * 1024;
const MAX_PHOTO_DIMENSION = 4096;
const PHOTO_QUALITY = 0.92;

async function compressPhoto(file: File): Promise<File> {
  if (file.size <= SKIP_COMPRESSION_UNDER_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", PHOTO_QUALITY),
    );
    if (!blob) return file;

    return new File(
      [blob],
      file.name.replace(/\.\w+$/, "") + ".jpg",
      { type: "image/jpeg" },
    );
  } catch {
    // Any failure here (unsupported format, etc.) just falls back to the
    // original file — the server-side size limit is the actual backstop.
    return file;
  }
}

export function AiPhotoImportForm({ tierListId }: { tierListId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<AiCandidate[] | null>(null);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Survives the reset back to the upload step, so someone doing a library
  // series-by-series (or shelf-by-shelf) across several photos gets
  // confirmation each round landed before they take the next photo.
  const [lastAddedCount, setLastAddedCount] = useState<number | null>(null);

  async function handleIdentify() {
    if (!file) {
      setError("Choose a photo first.");
      return;
    }
    setIdentifying(true);
    setError(null);

    const compressed = await compressPhoto(file);
    const formData = new FormData();
    formData.set("photo", compressed);
    const result = await identifyBooksFromPhoto(formData);

    setIdentifying(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCandidates(result.candidates);
    setUnmatchedCount(result.unmatchedCount);
    setSelected(new Set(result.candidates.map((_, i) => i)));
    setLastAddedCount(null);
  }

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function selectAll() {
    if (!candidates) return;
    setSelected(new Set(candidates.map((_, i) => i)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function handleConfirm() {
    if (!candidates || selected.size === 0) return;
    setConfirming(true);
    const fields = candidates
      .filter((_, i) => selected.has(i))
      .map((c) => bookFormFields(c.matched) as BookFields);
    const { added } = await confirmAiBooks(tierListId, fields);
    setConfirming(false);
    // Back to the upload step rather than navigating away — doing a whole
    // library series-by-series or shelf-by-shelf means taking several
    // photos in a row, and getting bounced back to the list after every
    // single one would make that tedious. The TopNav back button above is
    // how they leave once they're actually done.
    setFile(null);
    setCandidates(null);
    setUnmatchedCount(0);
    setSelected(new Set());
    setLastAddedCount(added);
  }

  function reset() {
    setFile(null);
    setCandidates(null);
    setUnmatchedCount(0);
    setSelected(new Set());
    setError(null);
    setLastAddedCount(null);
  }

  if (candidates) {
    return (
      <div className="flex flex-col gap-4">
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t match any of the books in that photo to something
            in our catalog.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Found {candidates.length} book
                {candidates.length === 1 ? "" : "s"}. Uncheck anything that
                got misread before adding.
              </p>
              {candidates.length > 1 && (
                <div className="flex shrink-0 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-muted-foreground hover:underline"
                  >
                    Deselect all
                  </button>
                </div>
              )}
            </div>
            <div className="flex max-h-[50vh] flex-col divide-y divide-border overflow-y-auto rounded-sm bg-card">
              {candidates.map((candidate, i) => {
                const thumbnail = secureThumbnail(
                  candidate.matched.volumeInfo.imageLinks?.thumbnail,
                );
                const authors = candidate.matched.volumeInfo.authors?.join(", ");
                return (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-3 text-left"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                      className="size-4 shrink-0 accent-primary"
                    />
                    <div className="relative h-14 w-9 shrink-0 overflow-hidden rounded-xs bg-muted">
                      {thumbnail && (
                        <Image
                          src={thumbnail}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {candidate.matched.volumeInfo.title}
                      </span>
                      {authors && (
                        <span className="truncate text-xs text-muted-foreground">
                          {authors}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {unmatchedCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {unmatchedCount} book{unmatchedCount === 1 ? "" : "s"} in the
            photo couldn&apos;t be matched to a catalog entry and{" "}
            {unmatchedCount === 1 ? "was" : "were"} skipped.
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={reset}
          >
            Try another photo
          </Button>
          {candidates.length > 0 && (
            <Button
              type="button"
              className="flex-1"
              disabled={selected.size === 0 || confirming}
              onClick={handleConfirm}
            >
              {confirming ? "Adding..." : `Add ${selected.size}`}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lastAddedCount !== null && (
        <p className="rounded-sm bg-card p-3 text-sm text-foreground">
          Added {lastAddedCount} book{lastAddedCount === 1 ? "" : "s"}. Take
          another photo to keep going, or tap Back above when you&apos;re
          done.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Book photo
        </span>
        <label
          htmlFor="photo"
          className="inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-sm bg-muted px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
        >
          Upload
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        {file && (
          <p className="truncate text-xs text-muted-foreground">
            {file.name}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        className="w-full"
        disabled={!file || identifying}
        onClick={handleIdentify}
      >
        {identifying ? "Identifying books..." : "Identify Books"}
      </Button>
    </div>
  );
}
