"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { MatchRing } from "@/components/match-ring";

// Persisted client-side (not just component state) — someone who dismisses
// this should not see it pop back up on their next visit. Same localStorage
// pattern already used elsewhere in the app for a sticky per-user UI
// preference (the theme toggle). Defaults to shown (not hidden) so the vast
// majority of users who've never dismissed it don't see a flash of empty
// space before it renders; only someone who *did* dismiss it previously
// sees a brief flash of the card before this effect hides it again.
const DISMISS_KEY = "tiera:hide-taste-score-card";

// The "?" explanation for these two numbers lives in the page header next
// to the "Compare" title (see compare/page.tsx's InfoPopover) rather than
// inside this card — no reason to show the same explanation twice on one
// page.
export function TasteScoreCard({
  bestMatchPercentage,
  matchedUserPercentage,
}: {
  bestMatchPercentage: number;
  matchedUserPercentage: number;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "true") {
      setDismissed(true);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="relative flex items-center justify-between gap-4 rounded-sm bg-card p-4 ring-1 ring-foreground/10">
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "true");
          setDismissed(true);
        }}
        aria-label="Hide taste score"
        className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-muted-foreground">
          Your average match score
        </span>
        <span className="text-3xl font-extrabold text-primary-link">
          {bestMatchPercentage}%
        </span>
        <span className="text-xs text-muted-foreground">
          You match with {matchedUserPercentage}% of users on Tiera
        </span>
      </div>
      <MatchRing percentage={bestMatchPercentage} size={72} strokeWidth={6}>
        <Sparkles className="size-6 text-primary" />
      </MatchRing>
    </div>
  );
}
