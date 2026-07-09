import { BookCover } from "@/components/book-cover";
import type { FavoriteBook } from "@/lib/db/favorites";

export function FavoritesGrid({ books }: { books: FavoriteBook[] }) {
  if (books.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No S or A tier books yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
      {books.map((book) => (
        <div key={book.bookId} className="flex flex-col gap-1.5">
          <BookCover src={book.thumbnail} alt={book.title} size={120} />
          <p className="line-clamp-2 text-xs font-medium text-foreground">
            {book.title}
          </p>
        </div>
      ))}
    </div>
  );
}
