import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupFromHome, continueAnonymously } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const serifStyle = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
};

// One screen: logo, pitch, real sign-up form — no nav, no footer, no
// scrolling. Replaces the old marketing page (hero list screenshot, How it
// works, activity feed) entirely; that version is preserved as-is at
// /landing-v1 if any of it needs to come back later. This page doubles as
// the primary /signup entry point (the form posts to the same signup
// action, just with its own error redirect — see signupFromHome in
// auth/actions.ts) — /signup and /login still exist separately, untouched.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Nothing left to say to someone already signed in — straight into the
  // app instead.
  if (user) {
    redirect("/explore");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      {/* True flex-centering measured perfectly equal space above/below,
          but the card's solid bg-card weight at the bottom reads as
          heavier than the logo/headline above it, so mathematically
          centered still looked low. mb-10 nudges the whole block up by
          about half that margin for a better optical balance. */}
      <div className="mb-10 w-full max-w-sm text-center">
        {/* Same icon + wordmark pairing TopBar renders on desktop — reused
            as-is rather than a new mark invented for this page alone. */}
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={32}
            height={32}
            className="rounded-sm"
          />
          <span className="text-xl font-semibold text-foreground" style={serifStyle}>
            Tiera
          </span>
        </div>

        <h1
          className="mb-3 text-[28px] leading-[1.15] font-semibold tracking-tight text-balance"
          style={serifStyle}
        >
          Rank. <em className="text-primary-link italic">Match.</em> Connect
        </h1>
        <p className="mx-auto mb-8 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
          Build your tier list, match with readers who share your taste, and
          discover your next favorite read.
        </p>

        <div className="rounded-sm bg-card p-6 text-left">
          {/* Shared by both forms below (email sign-up and anonymous) —
              rendered once, outside either one, since the error could come
              from whichever was actually submitted. Showing it inside the
              email fields unconditionally misattributed anonymous sign-in
              errors to the sign-up form (confirmed live: "Anonymous
              sign-ins are disabled" rendered right above the Sign up
              button, next to fields that were never touched). */}
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          <form action={signupFromHome} className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="mt-1 w-full">
              Sign up
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* No explanation of what an anonymous account means or how to
              make it permanent — that's deferred to the profile page for
              anonymous users later, not this form. */}
          <form action={continueAnonymously}>
            <Button
              type="submit"
              variant="outline"
              className="w-full text-muted-foreground"
            >
              Continue without an account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary-link underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
