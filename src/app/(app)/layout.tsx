import { Suspense } from "react";
import { NavBar } from "@/components/nav-bar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col pb-16">{children}</div>
      <Suspense fallback={null}>
        <NavBar />
      </Suspense>
    </>
  );
}
