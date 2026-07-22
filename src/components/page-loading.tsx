import { Loader2 } from "lucide-react";

// Shared fallback for every loading.tsx boundary — Next.js wraps a route
// segment's page in Suspense automatically when a loading.tsx exists, so
// one component at (app)/loading.tsx covers every page in the authenticated
// app (Sidebar/NavBar/TopBar stay mounted, only the content area shows
// this), same reasoning as (app)/error.tsx and (app)/not-found.tsx.
export function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Loader2
        className="size-6 animate-spin text-muted-foreground"
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
