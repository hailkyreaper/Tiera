import { TIERS } from "@/lib/tiers";
import { TierRowBar } from "./tier-row-bar";
import type { Columns } from "./types";

export function ReadOnlyTierBoard({ columns }: { columns: Columns }) {
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");

  return (
    <div className="flex flex-col gap-2">
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
