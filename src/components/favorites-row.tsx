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
        <h2 className="text-xs font-semibold text-muted-foreground uppercase">
          Top Favorites
        </h2>
        <Link href={viewMoreHref} className="text-xs text-primary">
          View more
        </Link>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {books.map((book) => (
          <div key={book.bookId} className="w-14 shrink-0">
            <BookCover src={book.thumbnail} alt={book.title} size={56} />
          </div>
        ))}
      </div>
    </div>
  );
}
