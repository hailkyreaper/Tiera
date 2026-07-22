import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Tiera
      </h1>
      <p className="max-w-sm text-muted-foreground">
        Discover entertainment you&apos;ll actually enjoy.
      </p>
      <Link href={user ? "/profile" : "/signup"} className={buttonVariants()}>
        {user ? "Go to profile" : "Get started"}
      </Link>
    </main>
  );
}
