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
        // text-foreground, not text-primary — purple-on-purple-tint measured
        // well under WCAG AA (3.84:1 dark / 3.58:1 light, need 4.5:1); the
        // neutral foreground color against this same tinted pill clears it
        // by a wide margin (16.98:1 / 13.29:1) while the bg-primary/15 tint
        // still carries the "this is a match stat" visual identity on its
        // own.
        "w-fit shrink-0 rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-foreground",
        className,
      )}
    >
      {percentage}% match
    </span>
  );
}
