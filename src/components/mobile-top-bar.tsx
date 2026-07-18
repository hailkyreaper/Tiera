import type { ReactNode } from "react";

// Mobile/tablet-only counterpart to TopBar's notifications slot — mobile
// previously had no notifications entry point at all (TopBar itself is
// `hidden ... lg:flex`, so its bell only ever existed on desktop). Kept
// deliberately minimal (just the bell, no logo/search) rather than mirroring
// TopBar's full layout — the bottom NavBar already covers branding/nav on
// mobile, this only exists to surface the one thing that was missing.
export function MobileTopBar({ notificationsSlot }: { notificationsSlot: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-end border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
      {notificationsSlot}
    </div>
  );
}
