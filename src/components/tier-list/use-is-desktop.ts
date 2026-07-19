"use client";

import { useEffect, useState } from "react";

// Matches Tailwind's `lg` breakpoint. Only needed where a value has to be
// computed in JS rather than picked via a `lg:` class — e.g. TierRow's
// column count, which feeds a dynamically-computed inline style
// (grid-template-columns varies with whether a tier badge is present), so
// it can't just be a responsive Tailwind class. Starts false (mobile) since
// `window` isn't available during SSR, then corrects after mount — a brief
// one-time layout adjustment on desktop page loads, not a functional issue.
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(query.matches);
    const listener = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return isDesktop;
}
