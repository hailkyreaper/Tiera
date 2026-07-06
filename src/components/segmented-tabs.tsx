import Link from "next/link";
import { cn } from "@/lib/utils";

export function SegmentedTabs<T extends string>({
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
    <div className="flex gap-2">
      {tabs.map((tab) => {
        const isActive = tab.value === current;

        return (
          <Link
            key={tab.value}
            href={`${basePath}?${paramName}=${tab.value}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
