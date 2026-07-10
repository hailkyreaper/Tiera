import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLibraryBooks, sortLibraryBooks, type LibrarySort } from "@/lib/db/library";
import { AddFromLibrarySection } from "@/components/add-from-library-section";
import { TopNav } from "@/components/top-nav";

type TierListRow = { id: string; title: string; user_id: string };
type ItemRow = { book_id: string };

export default async function AddFromLibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id } = await params;
  const { sort: rawSort } = await searchParams;
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

  const [libraryBooks, { data: existingItems }] = await Promise.all([
    getLibraryBooks(supabase, user.id),
    supabase
      .from("tier_list_items")
      .select("book_id")
      .eq("tier_list_id", id)
      .returns<ItemRow[]>(),
  ]);

  const alreadyInList = new Set((existingItems ?? []).map((i) => i.book_id));
  const availableBooks = libraryBooks.filter(
    (book) => !alreadyInList.has(book.bookId),
  );

  const sort: LibrarySort =
    rawSort === "title" || rawSort === "author" || rawSort === "rating"
      ? rawSort
      : "recent";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
      <TopNav title={`Add from library to ${tierList.title}`} />

      <AddFromLibrarySection
        books={sortLibraryBooks(availableBooks, sort)}
        tierListId={id}
        currentSort={sort}
      />
    </div>
  );
}
