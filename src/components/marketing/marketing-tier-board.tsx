import { cn } from "@/lib/utils";

// Decorative tier board for the logged-out landing page and auth screens —
// the hero visual is the app's own core mechanic (a real tier list), not a
// generic illustration. Deliberately static/typographic: no real cover
// images, both because a marketing page shouldn't depend on Open
// Library/Google Books being up, and because "spines" rendered as colored
// title cards read cleanly at every size without needing real art. Titles
// are real books already in the app's own catalog data (Mistborn, Red
// Rising, etc.) — the F-tier entry is the one deliberately fictional line,
// a small joke ("everyone else's fave") rather than a real title, since
// putting a real specific book in F on marketing copy read as needlessly
// picking a fight.
const ROWS: {
  tier: "S" | "A" | "B" | "C" | "D" | "F";
  badge: string;
  books: { title: string; color: string }[];
}[] = [
  {
    tier: "S",
    badge: "bg-red-600",
    books: [
      { title: "Mistborn", color: "bg-[#7a3b3b]" },
      { title: "Red Rising", color: "bg-[#3b4a5a]" },
    ],
  },
  {
    tier: "A",
    badge: "bg-orange-600",
    books: [
      { title: "Fourth Wing", color: "bg-[#4b3b5a]" },
      { title: "Nevernight", color: "bg-[#5a4a3b]" },
    ],
  },
  {
    tier: "B",
    badge: "bg-amber-600",
    books: [
      { title: "Gone Girl", color: "bg-[#5a3b4a]" },
      { title: "Circe", color: "bg-[#3b4a3d]" },
    ],
  },
  {
    tier: "C",
    badge: "bg-emerald-600",
    books: [{ title: "Piranesi", color: "bg-[#4a4a3b]" }],
  },
  {
    tier: "D",
    badge: "bg-blue-600",
    books: [{ title: "Verity", color: "bg-[#3b3f5a]" }],
  },
  {
    tier: "F",
    badge: "bg-slate-600",
    books: [{ title: "Everyone else's fave", color: "bg-[#4a3b3b]" }],
  },
];

export function MarketingTierBoard({
  compact = false,
  className,
}: {
  /** Smaller row height, no header line — used in the auth-page brand
   * panel, where the board is a supporting flourish, not the hero. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-2.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)] lg:rotate-1 lg:p-3.5",
        className,
      )}
    >
      {!compact && (
        <div className="flex items-center justify-between px-2 pt-1 pb-3">
          <span className="text-sm font-bold text-foreground">
            Reader Six&apos;s Picks
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            17 books
          </span>
        </div>
      )}
      {ROWS.map((row, i) => (
        <div
          key={row.tier}
          className="mb-[3px] grid grid-cols-[28px_1fr] overflow-hidden rounded-md opacity-0 lg:grid-cols-[34px_1fr]"
          style={{
            animation: "marketing-tier-row-in 0.5s cubic-bezier(.2,.7,.3,1) forwards",
            animationDelay: `${0.05 + i * 0.13}s`,
          }}
        >
          <div
            className={cn(
              "flex items-center justify-center text-[12px] font-extrabold text-white lg:text-[15px]",
              row.badge,
            )}
          >
            {row.tier}
          </div>
          <div className="flex flex-wrap gap-[3px] bg-muted p-[5px] lg:gap-1 lg:p-1.5">
            {row.books.map((book) => (
              <div
                key={book.title}
                className={cn(
                  "flex min-h-10 min-w-0 flex-1 items-end rounded p-1.5 lg:min-h-14 lg:p-2",
                  book.color,
                )}
              >
                <span
                  className="text-[9px] leading-tight font-bold text-white lg:text-[11.5px]"
                  style={{
                    fontFamily:
                      '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
                  }}
                >
                  {book.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
