import Link from "next/link";
import Image from "next/image";
import { cleanCoverUrl } from "@/lib/cover-url";
import { buttonVariants } from "@/components/ui/button";

const serifStyle = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
};

type PreviewBook = { id: string; title: string; thumbnail: string | null };

// Closing conversion moment — the page previously just ended at the
// footer after the last proof section with no final push. Same plain
// bg-card treatment as every other card on this page (no gradient/glow —
// this page doesn't use that anywhere else), with a small row of the
// founder's own real S-tier covers as a callback to the hero, rather than
// an invented graphic.
export function FinalCta({ previewBooks }: { previewBooks: PreviewBook[] }) {
  return (
    <section className="py-8 lg:py-12">
      <div className="flex flex-col items-center gap-5 rounded-sm bg-card px-6 py-10 text-center lg:px-10 lg:py-16">
        {previewBooks.length > 0 && (
          <div className="flex gap-1.5">
            {previewBooks.slice(0, 4).map((book) => (
              <div key={book.id} className="aspect-[2/3] h-14 w-10 overflow-hidden rounded-xs lg:h-16 lg:w-11">
                {book.thumbnail ? (
                  <Image
                    src={cleanCoverUrl(book.thumbnail)}
                    alt={book.title}
                    width={80}
                    height={120}
                    sizes="44px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
            ))}
          </div>
        )}
        <h2
          className="max-w-[20ch] text-[27px] leading-[1.2] font-semibold tracking-tight text-balance lg:text-[34px]"
          style={serifStyle}
        >
          Your shelf is waiting to be ranked.
        </h2>
        <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted-foreground">
          Join Tiera and find out exactly who reads like you do.
        </p>
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Sign up →
        </Link>
      </div>
    </section>
  );
}
