import { TIERS, type Tier } from "@/lib/tiers";
import { TierRowBar } from "./tier-row-bar";

export type DetailedBook = {
  id: string;
  title: string;
  thumbnail: string | null;
  description: string | null;
  authors: string[] | null;
  averageRating: number | null;
};

export type DetailedColumns = Record<Exclude<Tier, "unranked">, DetailedBook[]>;

export function ReadOnlyTierBoard({
  columns,
  highQuality = false,
}: {
  columns: DetailedColumns;
  /** For the shareable-image export (create flow's review step, and the
   * published-list 3-dot menu's Export option) — see TierRowBar. */
  highQuality?: boolean;
}) {
  const rankedTiers = TIERS.filter(
    (tier): tier is Exclude<Tier, "unranked"> => tier !== "unranked",
  );

  return (
    // Same divide-y hairline-block style as the interactive Create List
    // board (tier-board.tsx), instead of a flex gap, so both views match.
    <div className="flex flex-col divide-y divide-white/10 overflow-hidden">
      {rankedTiers.map((tier) => (
        <TierRowBar
          key={tier}
          tier={tier}
          books={columns[tier]}
          interactive
          highQuality={highQuality}
        />
      ))}
    </div>
  );
}
