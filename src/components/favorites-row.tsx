import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import type { FavoriteBook } from "@/lib/db/favorites";

export function FavoritesRow({
  books,
  viewMoreHref,
}: {
  books: FavoriteBook[];
  viewMoreHref: string;
}) {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Top Favorites
        </h2>
        <Link href={viewMoreHref} className="text-xs text-primary">
          View all
        </Link>
      </div>
      <div className="flex items-stretch gap-2">
        {books.map((book) => (
          <div key={book.bookId} className="min-w-0 flex-1">
            <BookCover src={book.thumbnail} alt={book.title} size={64} />
          </div>
        ))}
      </div>
    </div>
  );
}
