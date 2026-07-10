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

export function ReadOnlyTierBoard({ columns }: { columns: DetailedColumns }) {
  const rankedTiers = TIERS.filter(
    (tier): tier is Exclude<Tier, "unranked"> => tier !== "unranked",
  );

  return (
    // Same divide-y hairline-block style as the interactive Create List
    // board (tier-board.tsx), instead of a flex gap, so both views match.
    <div className="flex flex-col divide-y divide-white/10 overflow-hidden rounded-sm">
      {rankedTiers.map((tier) => (
        <TierRowBar key={tier} tier={tier} books={columns[tier]} interactive />
      ))}
    </div>
  );
}
