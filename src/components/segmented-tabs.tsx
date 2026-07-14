import Link from "next/link";
import { cn } from "@/lib/utils";

export function SegmentedTabs<T extends string>({
  basePath,
  paramName = "tab",
  tabs,
  current,
  extraParams,
}: {
  basePath: string;
  paramName?: string;
  tabs: { value: T; label: string }[];
  current: T;
  /** Other query params to carry along on every tab's link, e.g. keeping
   * `tab=for-you` set while switching a nested Popular/Recent sort toggle. */
  extraParams?: Record<string, string>;
}) {
  return (
    <div className="flex gap-2">
      {tabs.map((tab) => {
        const isActive = tab.value === current;
        const params = new URLSearchParams({
          ...extraParams,
          [paramName]: tab.value,
        });

        return (
          <Link
            key={tab.value}
            href={`${basePath}?${params.toString()}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors lg:px-5 lg:py-2 lg:text-base",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
