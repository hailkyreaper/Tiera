"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Short labels on purpose — this is a native <select>, so its closed-state
// width is driven by whichever option's text is longest and can't wrap or
// shrink below that. A longer "Sort by: ..." prefix here previously forced
// the select wider than a small mobile viewport, pushing the whole page
// into horizontal overflow (had to zoom out to reach anything off-screen).
const SORT_OPTIONS = [
  { value: "match", label: "Best Match" },
  { value: "ranked", label: "Most Ranked" },
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
      className="h-9 w-full min-w-0 max-w-full rounded-sm border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus:border-ring sm:w-auto"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
