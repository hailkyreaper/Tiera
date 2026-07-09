import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { searchBooks } from "@/lib/db/books";
import { addToUnrankedAndStay } from "./actions";
import { SearchResultCard } from "@/components/search-result-card";
import { BookSearchForm } from "@/components/book-search-form";
import { BackButton } from "@/components/back-button";

type TierListRow = { id: string; title: string; user_id: string };

export default async function ListSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tierList } = await supabase
    .from("tier_lists")
    .select("id, title, user_id")
    .eq("id", id)
    .maybeSingle<TierListRow>();

  if (!tierList || tierList.user_id !== user.id) {
    notFound();
  }

  const results = q ? await searchBooks(supabase, q) : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-semibold text-foreground">
          Add books to {tierList.title}
        </h1>
      </div>

      <BookSearchForm
        basePath={`/lists/${id}/search`}
        defaultValue={q}
        action={addToUnrankedAndStay}
        extraFields={{ tierListId: id }}
      />

      {q && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No results for &quot;{q}&quot;.
        </p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col divide-y divide-border">
          {results.map((book) => (
            <SearchResultCard
              key={book.id}
              book={book}
              action={addToUnrankedAndStay}
              extraFields={{ tierListId: id, q: q ?? "" }}
              buttonLabel="Add"
            />
          ))}
        </div>
      )}
    </div>
  );
}
