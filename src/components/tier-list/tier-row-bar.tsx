import Image from "next/image";
import { cleanCoverUrl } from "@/lib/cover-url";
import type { Tier } from "@/lib/tiers";
import { BookDetailDrawer } from "./book-detail-drawer";
import { TierRowGrid } from "./tier-row-grid";

const COLUMNS = 10;

// Each cover is one cell in a fixed 10 (+1 badge) column grid, so its real
// rendered width is roughly the card's content width / 11 — nowhere near
// the width={400} intrinsic size above, which only sets the aspect ratio.
// With no sizes hint, the browser assumes up to 100vw and fetches Next's
// largest matching deviceSize breakpoint regardless of the tiny actual
// slot (confirmed live via Lighthouse — this is the single largest image-
// weight contributor on the app, since a single list card can render up to
// 60 of these). Covers the realistic content-width range this renders in
// (mobile card columns down to ~340px, desktop list pages up to ~768px).
const COVER_SIZES = "(min-width: 1024px) 70px, 35px";

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
    <TierRowGrid tier={tier} columns={COLUMNS} itemCount={books.length}>
      {/* An empty tier has no cover to size the row from, so it'd otherwise
          collapse to the badge's own text line-height — a same-aspect-ratio
          invisible placeholder forces it to the exact height a real cover
          would give, matching every other row exactly regardless of
          container width (rather than a fixed min-h guess that only
          matched by coincidence). */}
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
                  sizes={COVER_SIZES}
                  className="h-auto w-full bg-muted"
                />
              </BookDetailDrawer>
            ) : (
              <Image
                src={cleanCoverUrl(book.thumbnail)}
                alt={book.title}
                width={400}
                height={600}
                quality={highQuality ? 100 : 75}
                sizes={COVER_SIZES}
                className="h-auto w-full bg-muted"
              />
            )
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
      ))}
    </TierRowGrid>
  );
}
