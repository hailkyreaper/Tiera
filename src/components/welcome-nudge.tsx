import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// One-shot first-run nudge, shown on Explore right after onboarding (see
// `welcome=true` set by setUsername's redirect) — the single "here's how to
// start" prompt instead of a multi-screen tutorial. Points at the one real
// next step (create a list, which is where Import from Goodreads/AI photo/
// Search all actually live) rather than trying to explain the whole app at
// once. Purely a query param, not persisted anywhere — it just won't be
// there on the next navigation, so there's no dismissed-state to track.
export function WelcomeNudge() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm bg-card p-6 text-center lg:p-8">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="size-6" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">
          Welcome to Tiera!
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start by ranking a few books — import your Goodreads library, snap
          a photo of your shelf, or just search for your favorites.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <Link href="/lists">
          <Button type="button">Create Your First List</Button>
        </Link>
        <Link
          href="/explore"
          className="px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </Link>
      </div>
    </div>
  );
}
