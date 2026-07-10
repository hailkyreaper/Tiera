import { BackButton } from "@/components/back-button";
import { cn } from "@/lib/utils";

/** Bordered top bar for any page reached via a back arrow — bleeds edge to
 * edge (matching the bottom NavBar's full-width border) regardless of the
 * page's own content padding. */
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
        "-mx-4 flex items-center gap-2 border-b border-border px-4 pb-3",
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
