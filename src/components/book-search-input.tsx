"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { searchBooksLive, addToUnrankedAndStay } from "@/app/(app)/lists/[id]/search/actions";
import { bookFormFields, secureThumbnail, type GoogleBookVolume } from "@/lib/google-books";
import { Input } from "@/components/ui/input";

/**
 * Search input for the "add books" flow: typing shows a live dropdown
 * (cover + title + author, quick-add without leaving the page); pressing
 * Enter submits the surrounding <form> for the fuller results grid below
 * (see search/page.tsx), same "q" field driving both.
 */
export function BookSearchInput({
  tierListId,
  defaultValue,
}: {
  tierListId: string;
  defaultValue?: string;
}) {
  const [query, setQuery] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<GoogleBookVolume[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  // Debounced requests can resolve out of order (a slower request for an
  // earlier keystroke finishing after a faster one for a later keystroke),
  // silently overwriting fresh results with stale ones. This tracks which
  // request is actually the latest so a late-arriving stale response gets
  // ignored instead of applied.
  const latestRequestId = useRef(0);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const requestId = ++latestRequestId.current;
    const timeout = setTimeout(() => {
      searchBooksLive(query).then((results) => {
        if (requestId === latestRequestId.current) {
          setSuggestions(results);
        }
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  async function quickAdd(book: GoogleBookVolume) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(bookFormFields(book))) {
      formData.set(key, value);
    }
    formData.set("tierListId", tierListId);
    formData.set("q", query);
    await addToUnrankedAndStay(formData);
    setAddedIds((prev) => new Set(prev).add(book.id));
  }

  return (
    <div className="relative flex-1">
      <Input
        name="q"
        type="search"
        placeholder="Search by title, author..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        // autoFocus can fire the browser's native focus before React finishes
        // hydrating and attaches this onFocus handler, leaving isOpen stuck
        // false forever even once results start coming in — onChange above
        // is the reliable fallback trigger, since typing always fires it.
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        autoComplete="off"
        autoFocus
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-2xl bg-popover p-1 shadow-md">
          {suggestions.map((book) => {
            const thumbnail = secureThumbnail(book.volumeInfo.imageLinks?.thumbnail);
            const authors = book.volumeInfo.authors?.join(", ");
            const added = addedIds.has(book.id);

            return (
              <div
                key={book.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
              >
                <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-xs bg-muted">
                  {thumbnail && (
                    <Image src={thumbnail} alt="" fill className="object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">
                    {book.volumeInfo.title}
                  </p>
                  {authors && (
                    <p className="truncate text-xs text-muted-foreground">
                      {authors}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  // Prevent the input's onBlur from closing the dropdown
                  // before the click's onClick fires.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => quickAdd(book)}
                  disabled={added}
                  className="shrink-0 text-xs font-medium text-primary disabled:text-muted-foreground"
                >
                  {added ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
