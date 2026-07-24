import Link from "next/link";
import { cn } from "@/lib/utils";

// Underline-style tab bar matching design2/"compare final.png" exactly —
// plain text, no pill background; the active tab is bold + purple with a
// purple underline bar, inactive tabs are muted grey, and a faint hairline
// runs under the whole row. Unlike the reference (tabs only as wide as
// their own text, left-aligned with empty space after), these stretch to
// fill the row edge-to-edge, per direct feedback — column count tracks
// however many tabs are actually passed in, rather than a hardcoded 3.
//
// Distinct from the shared SegmentedTabs component (pill-style, used by
// Explore/Search) rather than overloading it with a second visual language
// those pages never asked for.
export function CompareTabs<T extends string>({
  basePath,
  paramName = "tab",
  tabs,
  current,
}: {
  basePath: string;
  paramName?: string;
  tabs: { value: T; label: string }[];
  current: T;
}) {
  return (
    <div
      className="grid border-b border-border"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === current;
        return (
          <Link
            key={tab.value}
            href={`${basePath}?${paramName}=${tab.value}`}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-center text-sm font-semibold whitespace-nowrap",
              isActive
                ? "border-primary text-primary-link"
                : "border-transparent text-muted-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
