import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const serifStyle = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
};

// Closing conversion moment — the page previously just ended at the
// footer after the last proof section with no final push. Plain text on
// the page background (no card, no cover row) rather than another boxed
// panel — the page already has several bg-card sections above it, so the
// close reads better as a quieter, unboxed moment.
export function FinalCta() {
  return (
    <section className="py-8 lg:py-12">
      <div className="flex flex-col items-center gap-5 px-6 py-10 text-center lg:px-10 lg:py-16">
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
