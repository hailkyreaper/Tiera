import Image from "next/image";
import { TIER_BADGE_COLORS, type Tier } from "@/lib/tiers";

type PreviewBook = { id: string; title: string; thumbnail: string | null };

export function TierRowBar({
  tier,
  books,
}: {
  tier: Exclude<Tier, "unranked">;
  books: PreviewBook[];
}) {
  return (
    // shrink-0: without it, a sibling row wrapping to 2 lines squeezes every
    // other row shorter to compensate (flex items shrink by default) — same
    // fix as the interactive TierRow, see ReadOnlyTierBoard/ExploreListCard
    // for the shared flex-col parent this matters for.
    <div className="flex shrink-0 gap-1 overflow-hidden rounded-[2px]">
      <span
        className={`flex w-8 shrink-0 items-center justify-center self-stretch text-xs font-bold text-white ${TIER_BADGE_COLORS[tier]}`}
      >
        {tier}
      </span>
      {/* 8 fixed grid columns instead of flex-wrap: 1fr columns always divide
          the row's full width evenly, so there's never a leftover sliver too
          small for another cover but too wide to look intentional. min-h-10
          keeps an empty tier's row at a normal single-row height instead of
          collapsing to the badge's own text line-height. */}
      <div className="grid min-h-10 flex-1 grid-cols-8 content-start gap-0.5 self-stretch">
        {books.map((book) => (
          <div key={book.id} className="relative aspect-[2/3] w-full">
            {book.thumbnail ? (
              <Image
                src={book.thumbnail}
                alt={book.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
