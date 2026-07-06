import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TierBoard } from "@/components/tier-list/tier-board";
import type { Tier } from "@/lib/tiers";
import type { Card, Columns } from "@/components/tier-list/types";

type BookInfo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
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

  const { data: tierList } = await supabase
    .from("tier_lists")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; title: string }>();

  if (!tierList) {
    notFound();
  }

  const { data: items } = await supabase
    .from("tier_list_items")
    .select("id, tier, position, books(id, title, thumbnail_url)")
    .eq("tier_list_id", id)
    .order("position", { ascending: true })
    .returns<TierListItemRow[]>();

  const itemBookIds = new Set((items ?? []).map((item) => item.books.id));

  const { data: libraryBooks } = await supabase
    .from("user_books")
    .select("book_id, books(id, title, thumbnail_url)")
    .eq("user_id", user.id)
    .returns<UserBookRow[]>();

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

  for (const entry of libraryBooks ?? []) {
    if (itemBookIds.has(entry.books.id)) continue;
    initialColumns.library.push({
      bookId: entry.books.id,
      itemId: null,
      title: entry.books.title,
      thumbnail: entry.books.thumbnail_url,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">
        {tierList.title}
      </h1>
      <p className="text-sm text-muted-foreground">
        Drag books between tiers to rank them, or drag out to the library row
        to remove them from this list.
      </p>
      <TierBoard tierListId={id} initialColumns={initialColumns} />
    </div>
  );
}
