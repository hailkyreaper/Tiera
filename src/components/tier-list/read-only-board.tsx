import { TIERS } from "@/lib/tiers";
import { TierRowBar } from "./tier-row-bar";
import type { Columns } from "./types";

export function ReadOnlyTierBoard({ columns }: { columns: Columns }) {
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");

  return (
    // gap-2 (8px) reduced 40% to 4.8px per design feedback on tier-row spacing.
    <div className="flex flex-col gap-[4.8px]">
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
