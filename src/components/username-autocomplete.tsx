"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { searchUsernames } from "@/app/(app)/search/actions";
import { Input } from "@/components/ui/input";

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
      searchUsernames(query).then(setSuggestions);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative flex-1">
      <Input
        name="q"
        type="search"
        placeholder="Search by username..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-2xl bg-popover p-1 shadow-md">
          {suggestions.map((person) => (
            <Link
              key={person.id}
              href={`/u/${person.username}`}
              className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              @{person.username}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
