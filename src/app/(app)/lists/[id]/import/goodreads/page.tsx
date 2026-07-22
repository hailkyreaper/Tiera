import { notFound, redirect } from "next/navigation";
import { Switch } from "@base-ui/react/switch";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { importGoodreadsCsv } from "./actions";

type TierListRow = { id: string; title: string; user_id: string };

export default async function GoodreadsImportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierList = assertNoSupabaseError(
    await supabase
      .from("tier_lists")
      .select("id, title, user_id")
      .eq("id", id)
      .maybeSingle<TierListRow>(),
    "fetching list",
  );

  if (!tierList || tierList.user_id !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <TopNav title={`Import from Goodreads to ${tierList.title}`} />

      <div className="flex flex-col gap-2 rounded-sm bg-card p-4 text-sm text-muted-foreground">
        <h2 className="text-sm font-semibold text-foreground">
          How to get your Goodreads CSV
        </h2>
        <ol className="list-inside list-decimal space-y-1">
          <li>
            On Goodreads, go to{" "}
            <span className="text-foreground">My Books → Import/Export</span>
            .
          </li>
          <li>
            Click <span className="text-foreground">Export Library</span>.
          </li>
          <li>
            Once it&apos;s ready, download the CSV file it generates and
            upload it below.
          </li>
        </ol>
        <p className="pt-1">
          Only books on your <span className="text-foreground">Read</span>{" "}
          shelf are imported — to-read and currently-reading are skipped.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form
        action={importGoodreadsCsv}
        className="flex flex-col gap-4 rounded-sm bg-card p-4"
      >
        <input type="hidden" name="tierListId" value={id} />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Goodreads CSV file
          </span>
          <label
            htmlFor="file"
            className="inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-sm bg-muted px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Upload
          </label>
          <input
            id="file"
            type="file"
            name="file"
            accept=".csv"
            required
            className="sr-only"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              Auto-tier by rating
            </span>
            <span className="text-xs text-muted-foreground">
              5★ → S, 4★ → A, 3★ → B, 2★ → C, 1★ → D. Books on a &quot;dnf&quot;
              shelf go to F regardless of rating. Unrated, non-DNF books stay
              Unranked.
            </span>
          </div>
          <Switch.Root
            name="autoTier"
            value="true"
            defaultChecked
            className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-muted transition-colors data-[checked]:bg-primary"
          >
            <Switch.Thumb className="size-4 translate-x-1 rounded-full bg-background transition-transform data-[checked]:translate-x-5" />
          </Switch.Root>
        </div>

        <Button type="submit" className="w-full">
          Import
        </Button>
      </form>
    </div>
  );
}
