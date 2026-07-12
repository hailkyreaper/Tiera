"use client";

import { useEffect } from "react";

// Production-only — a registered service worker during `next dev` would
// intercept navigations against a server that's constantly hot-reloading,
// which is exactly the kind of confusing stale-state bug the reverted
// light-mode toggle caused (see CLAUDE.md). No user-visible effect either
// way; dev only ever runs this component with the check false.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
