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
      <div className="flex flex-1 flex-wrap content-start items-start gap-0.5 self-stretch">
        {books.map((book) => (
          <div key={book.id} className="relative h-10 w-8 shrink-0">
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
