import { BookCover } from "@/components/book-cover";
import type { SharedBook } from "@/lib/db/taste-match";

export function CompareBookRow({
  title,
  books,
}: {
  title: string;
  books: SharedBook[];
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase">
        {title}
      </h2>
      {books.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto">
          {books.slice(0, 6).map((book) => (
            <div key={book.bookId} className="w-16 shrink-0">
              <BookCover src={book.thumbnail} alt={book.title} size={64} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
