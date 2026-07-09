import { TIERS } from "@/lib/tiers";
import { TierRowBar } from "./tier-row-bar";
import type { Columns } from "./types";

export function ReadOnlyTierBoard({ columns }: { columns: Columns }) {
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");

  return (
    // Same divide-y hairline-block style as the interactive Create List
    // board (tier-board.tsx), instead of a flex gap, so both views match.
    <div className="flex flex-col divide-y divide-white/10 overflow-hidden rounded-sm">
      {rankedTiers.map((tier) => (
        <TierRowBar
          key={tier}
          tier={tier}
          books={columns[tier].map((card) => ({
            id: card.bookId,
            title: card.title,
            thumbnail: card.thumbnail,
          }))}
        />
      ))}
    </div>
  );
}
