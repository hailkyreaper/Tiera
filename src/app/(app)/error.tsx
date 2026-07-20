"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// In-app error boundary — catches errors thrown by pages inside the (app)
// route group, rendered inside (app)/layout.tsx so Sidebar/NavBar/TopBar
// stay visible and functional around it. Does NOT catch errors thrown by
// (app)/layout.tsx itself (e.g. Sidebar's own data fetch) — those bubble
// up to the root error.tsx instead, which is inherent to how Next.js
// scopes error boundaries to a segment's children, not its own layout.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        An unexpected error happened. Try again, or head back to Explore.
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link href="/explore">
          <Button type="button" variant="outline">
            Back to Explore
          </Button>
        </Link>
      </div>
    </div>
  );
}
