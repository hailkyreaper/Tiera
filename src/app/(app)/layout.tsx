import { Suspense } from "react";
import { NavBar } from "@/components/nav-bar";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { MobileTopBar } from "@/components/mobile-top-bar";
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
        <MobileTopBar
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
          <div className="flex flex-1 flex-col pb-16 lg:pb-0">{children}</div>
        </div>
      </div>
      <Suspense fallback={null}>
        <NavBar />
      </Suspense>
    </>
  );
}
