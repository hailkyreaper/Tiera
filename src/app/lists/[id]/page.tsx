import { notFound } from "next/navigation";
import { addSearchResultToList, setListVisibility } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { searchGoogleBooks } from "@/lib/google-books";
import { TierBoard } from "@/components/tier-list/tier-board";
import { ReadOnlyTierBoard } from "@/components/tier-list/read-only-board";
import { SearchResultCard } from "@/components/search-result-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Tier } from "@/lib/tiers";
import type { Card, Columns } from "@/components/tier-list/types";

type BookInfo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
};

type TierListRow = {
  id: string;
  title: string;
  user_id: string;
  is_public: boolean;
};

type TierListItemRow = {
  id: string;
  tier: Tier;
  position: number;
  books: BookInfo;
};

type UserBookRow = {
  book_id: string;
  books: BookInfo;
};

export default async function TierListPage({
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

  const { data: tierList } = await supabase
    .from("tier_lists")
    .select("id, title, user_id, is_public")
    .eq("id", id)
    .maybeSingle<TierListRow>();

  if (!tierList) {
    notFound();
  }

  const isOwner = user?.id === tierList.user_id;

  const { data: items } = await supabase
    .from("tier_list_items")
    .select("id, tier, position, books(id, title, thumbnail_url)")
    .eq("tier_list_id", id)
    .order("position", { ascending: true })
    .returns<TierListItemRow[]>();

  const initialColumns: Columns = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
    unranked: [],
    library: [],
  };

  for (const item of items ?? []) {
    const card: Card = {
      bookId: item.books.id,
      itemId: item.id,
      title: item.books.title,
      thumbnail: item.books.thumbnail_url,
    };
    initialColumns[item.tier].push(card);
  }

  if (!isOwner) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">
            {tierList.title}
          </h1>
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            Public list
          </span>
        </div>
        <ReadOnlyTierBoard columns={initialColumns} />
      </div>
    );
  }

  const itemBookIds = new Set((items ?? []).map((item) => item.books.id));

  const { data: libraryBooks } = await supabase
    .from("user_books")
    .select("book_id, books(id, title, thumbnail_url)")
    .eq("user_id", user!.id)
    .returns<UserBookRow[]>();

  for (const entry of libraryBooks ?? []) {
    if (itemBookIds.has(entry.books.id)) continue;
    initialColumns.library.push({
      bookId: entry.books.id,
      itemId: null,
      title: entry.books.title,
      thumbnail: entry.books.thumbnail_url,
    });
  }

  const searchResults = q ? await searchGoogleBooks(q) : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {tierList.title}
        </h1>
        <form action={setListVisibility}>
          <input type="hidden" name="tierListId" value={id} />
          <input
            type="hidden"
            name="isPublic"
            value={(!tierList.is_public).toString()}
          />
          <Button type="submit" variant="outline" size="sm">
            {tierList.is_public ? "Make Private" : "Make Public"}
          </Button>
        </form>
      </div>
      <p className="text-sm text-muted-foreground">
        Drag books between tiers to rank them, or drag out to the library row
        to remove them from this list.
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">
          Find a new book to add
        </h2>
        <form className="flex gap-2">
          <Input
            name="q"
            type="search"
            placeholder="Search by title, author..."
            defaultValue={q}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>

        {q && searchResults.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No results for &quot;{q}&quot;.
          </p>
        )}

        {searchResults.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {searchResults.map((book) => (
              <SearchResultCard
                key={book.id}
                book={book}
                action={addSearchResultToList}
                extraFields={{ tierListId: id }}
                buttonLabel="Add to Unranked"
              />
            ))}
          </div>
        )}
      </div>

      <TierBoard tierListId={id} initialColumns={initialColumns} />
    </div>
  );
}
