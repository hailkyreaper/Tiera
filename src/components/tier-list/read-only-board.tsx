import { BookTile } from "./book-tile";
import { TIERS } from "@/lib/tiers";
import type { Columns } from "./types";

export function ReadOnlyTierBoard({ columns }: { columns: Columns }) {
  return (
    <div className="flex flex-col gap-6">
      {TIERS.map((tier) => {
        const cards = columns[tier];

        return (
          <div key={tier} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              {tier === "unranked" ? "Unranked" : `Tier ${tier}`}
            </h2>
            <div className="flex min-h-24 flex-wrap gap-3 rounded-2xl bg-card p-3">
              {cards.length === 0 && (
                <p className="text-xs text-muted-foreground">No books here.</p>
              )}
              {cards.map((card) => (
                <BookTile
                  key={card.bookId}
                  title={card.title}
                  thumbnail={card.thumbnail}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
