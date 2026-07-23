import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/marketing/wordmark";
import { AuthBrandPanel } from "@/components/marketing/auth-brand-panel";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <Wordmark className="mb-11" />
          <h1
            className="mb-2 text-[26px] font-semibold lg:text-[30px]"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
            }}
          >
            Create your account
          </h1>
          <p className="mb-8 text-[15px] text-muted-foreground">
            Start building your taste profile on Tiera.
          </p>

          <form action={signup} className="flex flex-col gap-[18px]">
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="mt-1 w-full">
              Sign up
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted-foreground">
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

      <AuthBrandPanel />
    </main>
  );
}
