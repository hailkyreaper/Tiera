"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Root-level error boundary — catches anything uncaught outside the (app)
// shell (or thrown by (app)/layout.tsx itself, which its own error.tsx
// can't catch — see that file's comment). No nav chrome available here,
// so this is the last-resort fallback; (app)/error.tsx handles the much
// more common case of an error inside a logged-in page.
export default function RootError({
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
        An unexpected error happened. Try again, or head back home.
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link href="/">
          <Button type="button" variant="outline">
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
