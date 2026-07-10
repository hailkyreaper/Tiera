import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { runBackfill } from "./actions";
import { Button } from "@/components/ui/button";

export default async function BackfillCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!(await isAdmin(supabase, user.id))) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-xl font-semibold text-foreground">
        Backfill book data
      </h1>
      <p className="text-sm text-muted-foreground">
        One-time: re-fetches genre categories for every book (Open Library
        first, falling back to Google Books), and fills in a cover or
        synopsis for any book still missing one.
      </p>
      <form action={runBackfill}>
        <Button type="submit">Run backfill</Button>
      </form>
      {result && <p className="text-sm text-foreground">{result}</p>}
    </div>
  );
}
