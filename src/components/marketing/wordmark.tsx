import Link from "next/link";
import { cn } from "@/lib/utils";

// Shared logged-out wordmark (landing nav + both auth pages). Text-only for
// now — the placeholder four-color stripe mark was removed pending a real
// logo asset.
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "text-[19px] font-semibold text-foreground lg:text-[22px]",
        className,
      )}
      style={{
        fontFamily:
          '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
      }}
    >
      Tiera
    </Link>
  );
}
