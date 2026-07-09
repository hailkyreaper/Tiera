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
    <div className="flex h-10 gap-1 overflow-hidden rounded-[2px]">
      <span
        className={`flex w-8 shrink-0 items-center justify-center text-xs font-bold text-white ${TIER_BADGE_COLORS[tier]}`}
      >
        {tier}
      </span>
      <div className="flex flex-1 flex-nowrap gap-0.5 overflow-x-auto bg-white/5">
        {books.map((book, index) => (
          <div
            key={book.id}
            className={`relative w-8 shrink-0 ${
              index !== 0 ? "border-l border-white/10" : ""
            }`}
          >
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
