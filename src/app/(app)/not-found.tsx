import Link from "next/link";
import { Button } from "@/components/ui/button";

// In-app 404 — catches notFound() calls from pages inside the (app) route
// group (missing list, missing user, etc.). Rendered inside (app)/layout.tsx,
// so Sidebar/NavBar/TopBar stay visible around it instead of the bare root
// not-found.tsx taking over the whole screen.
export default function AppNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist, or the link might be broken.
      </p>
      <Link href="/explore">
        <Button type="button">Back to Explore</Button>
      </Link>
    </div>
  );
}
