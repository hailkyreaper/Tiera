"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { searchUsernames } from "@/app/(app)/search/actions";

/**
 * Styled to match BookSearchInput's continuous-pill bar (single bordered
 * container, trailing icon-only submit button) rather than the plain
 * shadcn Input + separate button it used before.
 */
export function UsernameAutocomplete({
  defaultValue,
}: {
  defaultValue?: string;
}) {
  const [query, setQuery] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<
    { id: string; username: string }[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchUsernames(query)
        .then(setSuggestions)
        .catch((error) => {
          // Same gap as BookSearchInput's live search — a network failure
          // here previously became an unhandled promise rejection with no
          // visible effect beyond the dropdown silently never updating.
          console.error("Username search failed:", error);
          setSuggestions([]);
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
          placeholder="Search by username..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          autoComplete="off"
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
          {suggestions.map((person) => (
            <Link
              key={person.id}
              href={`/u/${person.username}`}
              className="block rounded-xs px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              @{person.username}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
