"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchBooksLive } from "@/app/(app)/lists/[id]/search/actions";
import { bookFormFields, secureThumbnail, type GoogleBookVolume } from "@/lib/google-books";
import { AddBookButton } from "@/components/add-book-button";

/**
 * Search input for the "add books" flow: typing shows a live dropdown
 * (cover + title + author, quick-add without leaving the page); pressing
 * Enter or the trailing search icon submits the surrounding <form> for the
 * fuller results below (see book-search-form.tsx), same "q" field driving
 * both. The add action itself is caller-supplied so this same input can add
 * to a tier list (Create List) or straight to the library (general Search).
 */
export function BookSearchInput({
  defaultValue,
  action,
  extraFields,
  autoFocus = true,
}: {
  defaultValue?: string;
  action: (formData: FormData) => void | Promise<void>;
  extraFields?: Record<string, string>;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<GoogleBookVolume[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative flex-1">
      <div className="flex items-center gap-1 rounded-sm border border-input bg-transparent pr-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <input
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
          autoFocus={autoFocus}
          className="h-8 min-w-0 flex-1 bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex size-6 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="size-4" />
        </button>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-sm bg-popover p-1 shadow-md">
          {suggestions.map((book) => {
            const thumbnail = secureThumbnail(book.volumeInfo.imageLinks?.thumbnail);
            const authors = book.volumeInfo.authors?.join(", ");

            return (
              <div
                key={book.id}
                className="flex items-center gap-2 rounded-xs px-2 py-1.5 hover:bg-muted"
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
                {/* onMouseDown preventDefault: without it, the input's blur
                    (focus moving to this button) fires before the click,
                    closing the dropdown out from under the click. */}
                <div
                  onMouseDown={(event) => event.preventDefault()}
                  className="shrink-0"
                >
                  <AddBookButton
                    action={action}
                    fields={{ ...bookFormFields(book), q: query, ...extraFields }}
                    label="Add"
                    variant="link"
                    size="xs"
                    className="px-0 no-underline hover:underline"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
