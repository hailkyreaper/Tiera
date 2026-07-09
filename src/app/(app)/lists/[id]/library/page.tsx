import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addFromLibraryAndStay } from "./actions";
import { BookCover } from "@/components/book-cover";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";

type TierListRow = { id: string; title: string; user_id: string };
type UserBookRow = {
  book_id: string;
  books: { id: string; title: string; thumbnail_url: string | null };
};
type ItemRow = { book_id: string };

export default async function AddFromLibraryPage({
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
    .select("id, title, user_id")
    .eq("id", id)
    .maybeSingle<TierListRow>();

  if (!tierList || tierList.user_id !== user.id) {
    notFound();
  }

  const [{ data: libraryBooks }, { data: existingItems }] = await Promise.all([
    supabase
      .from("user_books")
      .select("book_id, books(id, title, thumbnail_url)")
      .eq("user_id", user.id)
      .returns<UserBookRow[]>(),
    supabase
      .from("tier_list_items")
      .select("book_id")
      .eq("tier_list_id", id)
      .returns<ItemRow[]>(),
  ]);

  const alreadyInList = new Set((existingItems ?? []).map((i) => i.book_id));
  const availableBooks = (libraryBooks ?? []).filter(
    (entry) => !alreadyInList.has(entry.books.id),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-semibold text-foreground">
          Add from library to {tierList.title}
        </h1>
      </div>

      {availableBooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Everything in your library is already in this list.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {availableBooks.map((entry) => (
            <div key={entry.books.id} className="flex h-full flex-col gap-2">
              <BookCover
                src={entry.books.thumbnail_url}
                alt={entry.books.title}
              />
              <p className="line-clamp-2 flex-1 text-sm font-medium text-foreground">
                {entry.books.title}
              </p>
              <form action={addFromLibraryAndStay}>
                <input type="hidden" name="tierListId" value={id} />
                <input type="hidden" name="bookId" value={entry.books.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Add
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
