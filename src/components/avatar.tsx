import Image from "next/image";
import { cn } from "@/lib/utils";

// Shared "show the avatar, or a circle with the first letter of the name"
// pattern — this was independently duplicated at 9+ call sites (Explore
// cards, Compare, Profile, /u/[username], comments, list creator header,
// Top Matches rail/card, the following list), each with its own copy of the
// same two-branch JSX. One of them (Sidebar's mini user card) had drifted
// enough to drop the fallback entirely, silently showing a blank circle —
// exactly the kind of divergence sharing one component prevents.
export function Avatar({
  src,
  name,
  imageSize,
  sizeClassName,
  textClassName = "text-sm",
  className,
}: {
  src?: string | null;
  name: string;
  /** Pixel value passed to next/image's width/height — only affects the
   * intrinsic aspect ratio/srcset choice, not the rendered box size (that's
   * `sizeClassName`, which can carry responsive variants like `lg:size-9`
   * that a single width/height number can't express on its own). */
  imageSize: number;
  /** Tailwind size utility for the rendered box, e.g. "size-8" or
   * "size-7 lg:size-9". */
  sizeClassName: string;
  /** Tailwind text utility for the fallback initial, e.g. "text-xs". */
  textClassName?: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={imageSize}
        height={imageSize}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeClassName,
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground",
        sizeClassName,
        textClassName,
        className,
      )}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
