import Link from "next/link";
import { Button } from "@/components/ui/button";

// Root-level 404 — catches genuinely unmatched routes (no (app) shell
// context available yet, e.g. a bad link hit while logged out), so this
// has no nav chrome of its own. See (app)/not-found.tsx for the
// in-app version that keeps Sidebar/NavBar visible.
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist, or the link might be broken.
      </p>
      <Link href="/">
        <Button type="button">Go home</Button>
      </Link>
    </div>
  );
}
