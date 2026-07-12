import { cn } from "@/lib/utils";

// Shared "N% match" indicator — shown everywhere the app surfaces how
// closely two users' tastes align (Explore cards, Compare, the Top Matches
// rail, Recommendations, list detail). Used to be three different visual
// treatments split across 5 files (plain colored text, a bordered pill, a
// filled pill) that had drifted apart independently — standardized on the
// filled pill (user's call).
export function MatchBadge({
  percentage,
  className,
}: {
  percentage: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "w-fit shrink-0 rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary",
        className,
      )}
    >
      {percentage}% match
    </span>
  );
}
