import type { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type LibraryBook = {
  bookId: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  averageRating: number | null;
  description: string | null;
  addedAt: string;
  wantToRead: boolean;
  position: number;
};

export type LibrarySort = "recent" | "title" | "author" | "rating" | "custom";

type UserBookRow = {
  created_at: string;
  want_to_read: boolean;
  position: number;
  books: {
    id: string;
    title: string;
    authors: string[] | null;
    thumbnail_url: string | null;
    average_rating: number | null;
    description: string | null;
  };
};

export async function getLibraryBooks(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<LibraryBook[]> {
  const data = assertNoSupabaseError(
    await supabase
      .from("user_books")
      .select(
        "created_at, want_to_read, position, books(id, title, authors, thumbnail_url, average_rating, description)",
      )
      .eq("user_id", userId)
      .returns<UserBookRow[]>(),
    "fetching library books",
  );

  return (data ?? []).map((row) => ({
    bookId: row.books.id,
    title: row.books.title,
    authors: row.books.authors ?? [],
    thumbnail: row.books.thumbnail_url,
    averageRating: row.books.average_rating,
    description: row.books.description,
    addedAt: row.created_at,
    wantToRead: row.want_to_read,
    position: row.position,
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
    case "custom":
      sorted.sort((a, b) => a.position - b.position);
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
