import { runBackfill } from "./actions";
import { Button } from "@/components/ui/button";

export default async function BackfillCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-foreground">
        Backfill book categories
      </h1>
      <p className="text-sm text-muted-foreground">
        One-time: re-fetches genre categories from Google Books for any book
        missing them.
      </p>
      <form action={runBackfill}>
        <Button type="submit">Run backfill</Button>
      </form>
      {result && <p className="text-sm text-foreground">{result}</p>}
    </div>
  );
}
