import { Suspense } from "react";
import { NavBar } from "@/components/nav-bar";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { NotificationsBell } from "@/components/notifications-bell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1650px] flex-1 flex-col">
        <TopBar
          notificationsSlot={
            <Suspense fallback={null}>
              <NotificationsBell />
            </Suspense>
          }
        />
        <div className="flex flex-1">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          {/* min-w-0 is load-bearing: this is a flex item next to Sidebar,
           * and a flex item's default min-width:auto refuses to shrink
           * below whatever its deepest content naturally wants — even
           * though every page rendered inside correctly shrinks/truncates
           * once actually given a narrower width (verified directly). With
           * Sidebar hidden on mobile, that meant every single page rendered
           * a few dozen px wider than the viewport, forcing users to pinch-
           * zoom out to reach anything past the edge. This one override is
           * what lets the whole subtree shrink to the real viewport width. */}
          <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
            {children}
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <NavBar />
      </Suspense>
    </>
  );
}
