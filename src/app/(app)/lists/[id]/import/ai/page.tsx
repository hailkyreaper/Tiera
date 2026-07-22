import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";
import { TopNav } from "@/components/top-nav";
import { AiPhotoImportForm } from "@/components/tier-list/ai-photo-import-form";
import { MAX_BOOKS_PER_PHOTO } from "@/lib/gemini";

type TierListRow = { id: string; title: string; user_id: string };

export default async function AiImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      <TopNav title={`Import with AI to ${tierList.title}`} />

      <div className="flex flex-col gap-2 rounded-sm bg-card p-4 text-sm text-muted-foreground">
        <h2 className="text-sm font-semibold text-foreground">
          Add books from a photo
        </h2>
        <p>
          Take or upload a photo of a book cover, a stack, a series, or a
          full shelf (up to {MAX_BOOKS_PER_PHOTO} books). Each one gets
          matched against our book catalog, and you&apos;ll get to review
          the results before anything is added.
        </p>
      </div>

      <AiPhotoImportForm tierListId={id} />
    </div>
  );
}
