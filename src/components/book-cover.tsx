import Image from "next/image";
import { cleanCoverUrl } from "@/lib/cover-url";

export function BookCover({
  src,
  alt,
  size = 200,
}: {
  src: string | null | undefined;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div className="flex aspect-2/3 w-full items-center justify-center rounded-sm bg-muted text-xs text-muted-foreground">
        No cover
      </div>
    );
  }

  return (
    <Image
      src={cleanCoverUrl(src)}
      alt={alt}
      width={size}
      height={Math.round(size * 1.5)}
      // Every caller wraps this in a container roughly `size`px wide (see
      // call sites) but the image itself is styled w-full/h-auto, which
      // makes it CSS-responsive — without a `sizes` hint, the browser has
      // no way to know that and defaults to assuming it could render up to
      // 100vw wide, fetching Next's largest matching deviceSize breakpoint
      // (confirmed live via Lighthouse: a 52px-wide cover was pulling a
      // 331x500/35KB image). Passing size as a fixed px target matches
      // Next's own documented guidance for "displayed at roughly a known
      // size" and cuts the fetched resolution down to what's actually
      // needed, at whatever DPR the browser is on.
      sizes={`${size}px`}
      className="h-auto w-full rounded-sm object-cover"
    />
  );
}
