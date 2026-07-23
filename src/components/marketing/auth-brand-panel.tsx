import { MarketingTierBoard } from "@/components/marketing/marketing-tier-board";

// Desktop-only right panel on /login and /signup — hidden on mobile, where
// the form alone fills the screen (a split layout has no room to work with
// at phone widths). Shares the same tier-board visual as the landing hero,
// just smaller and without its own header line, so it reads as "the same
// idea, quieter" rather than a second unrelated illustration.
export function AuthBrandPanel() {
  return (
    <div className="hidden items-center justify-center border-l border-border bg-card p-10 lg:flex">
      <div className="w-full max-w-[320px]">
        <MarketingTierBoard compact className="lg:rotate-0 lg:shadow-none" />
      </div>
    </div>
  );
}
