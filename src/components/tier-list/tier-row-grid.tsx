import { forwardRef, type ReactNode } from "react";
import { TIER_BADGE_COLORS, type Tier } from "@/lib/tiers";

// Shared visual shell for every "colored tier badge + N-column grid of
// books" row in the app — both the read-only preview (TierRowBar, used on
// Explore/list detail/the shareable export image) and the interactive
// drag-and-drop board (TierRow) compose this instead of each maintaining
// their own copy. They used to be two separate implementations that had
// quietly drifted apart (only one of them got a proportional-badge fix);
// sharing this shell means a change here reaches both at once.
//
// The badge is the grid's own first column (`col-start-1`), not a fixed
// pixel width next to the grid — so it's always exactly as wide as one
// book cover, at whatever column count/container width the caller uses.
//
// The badge's row span used to be `row-end-[-1]` ("span to the last grid
// line"), on the assumption that covers implicit rows CSS Grid adds once
// there are more items than fit in one row. That assumption was wrong —
// confirmed live on a 40+ book tier (design/example1.png): `-1` did NOT
// reliably resolve to "however many implicit rows auto-placement ends up
// creating." Past a certain row count the badge's color stopped extending,
// and — worse — rows past that point stopped reserving column 1 for the
// badge at all, so a book landed there instead, visibly shifting every
// item after it. Fixed by computing the exact row count ourselves
// (`itemCount`/`columns`) and spanning to that precise line instead of
// gambling on `-1`.
export const TierRowGrid = forwardRef<
  HTMLDivElement,
  {
    tier: Tier;
    /** Number of item columns, not counting the badge — the badge adds one
     * more column on top of this when the tier isn't "unranked". */
    columns: number;
    /** How many real cells will render as children (the actual book count,
     * or 1 for an empty tier's placeholder) — used to compute exactly how
     * many rows the badge needs to span, since guessing via CSS alone
     * turned out not to work past a handful of wrapped rows. */
    itemCount: number;
    children: ReactNode;
    gap?: string;
  }
>(function TierRowGrid(
  { tier, columns, itemCount, children, gap = "0.125rem" },
  ref,
) {
  const totalColumns = tier === "unranked" ? columns : columns + 1;
  const rowCount = Math.max(1, Math.ceil(Math.max(itemCount, 1) / columns));

  return (
    <div
      ref={ref}
      className="grid shrink-0 content-start"
      style={{
        gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`,
        gap,
      }}
    >
      {tier !== "unranked" && (
        <span
          className={`col-start-1 flex items-center justify-center text-xs font-bold text-white lg:text-2xl ${TIER_BADGE_COLORS[tier]}`}
          style={{ gridRow: `1 / ${rowCount + 1}` }}
        >
          {tier}
        </span>
      )}
      {children}
    </div>
  );
});
