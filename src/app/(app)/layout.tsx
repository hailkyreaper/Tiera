import { Suspense } from "react";
import { NavBar } from "@/components/nav-bar";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-1">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
        <div className="flex flex-1 flex-col pb-16 lg:pb-0">{children}</div>
      </div>
      <Suspense fallback={null}>
        <NavBar />
      </Suspense>
    </>
  );
}
