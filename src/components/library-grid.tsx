import { BookCover } from "@/components/book-cover";
import { LibraryBookMenu } from "@/components/library-book-menu";
import type { LibraryBook } from "@/lib/db/library";

export function LibraryGrid({ books }: { books: LibraryBook[] }) {
  if (books.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No books match this filter.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
      {books.map((book) => (
        <div key={book.bookId} className="flex flex-col gap-1.5">
          <BookCover src={book.thumbnail} alt={book.title} size={120} />
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">
                {book.title}
              </p>
              {book.authors[0] && (
                <p className="text-[11px] text-muted-foreground">
                  {book.authors[0]}
                </p>
              )}
            </div>
            <LibraryBookMenu bookId={book.bookId} />
          </div>
        </div>
      ))}
    </div>
  );
}
