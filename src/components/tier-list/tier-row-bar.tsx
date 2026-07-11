import Image from "next/image";
import { TIER_BADGE_COLORS, type Tier } from "@/lib/tiers";
import { cleanCoverUrl } from "@/lib/cover-url";
import { BookDetailDrawer } from "./book-detail-drawer";

type PreviewBook = {
  id: string;
  title: string;
  thumbnail: string | null;
  description?: string | null;
  authors?: string[] | null;
  averageRating?: number | null;
};

export function TierRowBar({
  tier,
  books,
  interactive = false,
  highQuality = false,
}: {
  tier: Exclude<Tier, "unranked">;
  books: PreviewBook[];
  /** Wraps each cover in a tap-to-open synopsis drawer — only used on the
   * visitor-facing list detail page, not the Explore feed's card previews. */
  interactive?: boolean;
  /** Requests full-quality (rather than Next's default 75%) optimized
   * images — used by the review step's shareable image export, where the
   * capture gets upscaled (pixelRatio) and compression artifacts become
   * visible. Deliberately still routed through Next's same-origin image
   * proxy rather than `unoptimized` (which serves the raw external URL
   * directly) — Open Library/Google's cover servers don't send permissive
   * CORS headers, so a cross-origin image there made the canvas capture
   * library fail outright instead of just looking soft. */
  highQuality?: boolean;
}) {
  return (
    // shrink-0: without it, a sibling row wrapping to 2 lines squeezes every
    // other row shorter to compensate (flex items shrink by default) — same
    // fix as the interactive TierRow, see ReadOnlyTierBoard/ExploreListCard
    // for the shared flex-col parent this matters for. Rounding/clipping now
    // lives on that shared parent (divide-y block) instead of per-row, to
    // match the interactive Create List board's look.
    <div className="flex shrink-0 gap-1">
      <span
        className={`flex w-8 shrink-0 items-center justify-center self-stretch text-xs font-bold text-white ${TIER_BADGE_COLORS[tier]}`}
      >
        {tier}
      </span>
      {/* 8 fixed grid columns instead of flex-wrap: 1fr columns always divide
          the row's full width evenly, so there's never a leftover sliver too
          small for another cover but too wide to look intentional. An empty
          tier has no cover to size the row from, so it'd otherwise collapse
          to the badge's own text line-height — a same-aspect-ratio invisible
          placeholder forces it to the exact height a real cover would give,
          matching every other row exactly regardless of container width
          (rather than a fixed min-h guess that only matched by coincidence). */}
      <div className="grid flex-1 grid-cols-8 content-start gap-0.5 self-stretch">
        {books.length === 0 && (
          <div className="invisible aspect-[2/3] w-full" aria-hidden="true" />
        )}
        {books.map((book) => (
          // aspect-[2/3] caps outlier-tall covers (clipped from the bottom
          // via overflow-hidden) instead of letting one stretch the row —
          // see SortableBookChip for the same technique in more detail.
          <div key={book.id} className="aspect-[2/3] w-full overflow-hidden">
            {book.thumbnail ? (
              interactive ? (
                <BookDetailDrawer
                  book={{
                    id: book.id,
                    title: book.title,
                    thumbnail: book.thumbnail,
                    description: book.description ?? null,
                    authors: book.authors ?? null,
                    averageRating: book.averageRating ?? null,
                  }}
                >
                  <Image
                    src={cleanCoverUrl(book.thumbnail)}
                    alt={book.title}
                    width={400}
                    height={600}
                    quality={highQuality ? 100 : 75}
                    className="h-auto w-full"
                  />
                </BookDetailDrawer>
              ) : (
                <Image
                  src={cleanCoverUrl(book.thumbnail)}
                  alt={book.title}
                  width={400}
                  height={600}
                  quality={highQuality ? 100 : 75}
                  className="h-auto w-full"
                />
              )
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
