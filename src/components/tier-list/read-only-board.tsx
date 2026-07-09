import { TIERS } from "@/lib/tiers";
import { TierRowBar } from "./tier-row-bar";
import type { Columns } from "./types";

export function ReadOnlyTierBoard({ columns }: { columns: Columns }) {
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");
  const hasAnyRanked = rankedTiers.some((tier) => columns[tier].length > 0);

  return (
    <div className="flex flex-col gap-2">
      {hasAnyRanked ? (
        rankedTiers.map((tier) => (
          <TierRowBar
            key={tier}
            tier={tier}
            books={columns[tier].map((card) => ({
              id: card.bookId,
              title: card.title,
              thumbnail: card.thumbnail,
            }))}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No books ranked yet.</p>
      )}
    </div>
  );
}
