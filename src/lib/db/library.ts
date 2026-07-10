import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type LibraryBook = {
  bookId: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  averageRating: number | null;
  addedAt: string;
};

export type LibrarySort = "recent" | "title" | "author" | "rating";

type UserBookRow = {
  created_at: string;
  books: {
    id: string;
    title: string;
    authors: string[] | null;
    thumbnail_url: string | null;
    average_rating: number | null;
  };
};

export async function getLibraryBooks(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<LibraryBook[]> {
  const { data } = await supabase
    .from("user_books")
    .select(
      "created_at, books(id, title, authors, thumbnail_url, average_rating)",
    )
    .eq("user_id", userId)
    .returns<UserBookRow[]>();

  return (data ?? []).map((row) => ({
    bookId: row.books.id,
    title: row.books.title,
    authors: row.books.authors ?? [],
    thumbnail: row.books.thumbnail_url,
    averageRating: row.books.average_rating,
    addedAt: row.created_at,
  }));
}

export function sortLibraryBooks(
  books: LibraryBook[],
  sort: LibrarySort,
): LibraryBook[] {
  const sorted = [...books];
  switch (sort) {
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "author":
      sorted.sort((a, b) =>
        (a.authors[0] ?? "").localeCompare(b.authors[0] ?? ""),
      );
      break;
    case "rating":
      sorted.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
      break;
    case "recent":
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      );
      break;
  }
  return sorted;
}
