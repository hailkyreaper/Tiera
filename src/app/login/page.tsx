import Link from "next/link";
import { login } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/marketing/wordmark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Wordmark className="mb-11" />
        <h1
          className="mb-2 text-[26px] font-semibold lg:text-[30px]"
          style={{
            fontFamily:
              '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
          }}
        >
          Welcome back
        </h1>
        <p className="mb-8 text-[15px] text-muted-foreground">
          Log in to keep building your tier lists.
        </p>

        <form action={login} className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="mt-1 w-full">
            Log in
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary-link underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
