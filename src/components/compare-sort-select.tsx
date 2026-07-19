"use client";

import { ArrowUpDown } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DropdownSelect } from "@/components/dropdown-select";

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
    <DropdownSelect
      value={sort}
      options={SORT_OPTIONS}
      onChange={handleChange}
      icon={ArrowUpDown}
    />
  );
}
