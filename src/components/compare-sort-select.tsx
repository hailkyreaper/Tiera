"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "match", label: "Sort by: Best Match" },
  { value: "ranked", label: "Sort by: Most Books Ranked" },
];

export function CompareSortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "match";

  function handleChange(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value === "match") params.delete("sort");
    else params.set("sort", value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={sort}
      onChange={(event) => handleChange(event.target.value)}
      className="h-9 rounded-sm border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus:border-ring"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
