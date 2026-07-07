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
        <BookCover
          key={book.bookId}
          src={book.thumbnail}
          alt={book.title}
          size={120}
        />
      ))}
    </div>
  );
}
