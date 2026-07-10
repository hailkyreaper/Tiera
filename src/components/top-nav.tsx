import { BackButton } from "@/components/back-button";
import { cn } from "@/lib/utils";

/** Compact top bar for any page reached via a back arrow — no border, no
 * vertical padding of its own, so it stays as short as possible; the page's
 * own gap/padding provides spacing around it. */
export function TopNav({
  title,
  center = false,
}: {
  title?: string;
  center?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        center && "grid grid-cols-[2.25rem_1fr_2.25rem]",
      )}
    >
      <BackButton />
      {title && (
        <h1
          className={cn(
            "min-w-0 flex-1 truncate text-lg font-semibold text-foreground",
            center && "text-center",
          )}
        >
          {title}
        </h1>
      )}
    </div>
  );
}
