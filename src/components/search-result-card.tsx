import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { secureThumbnail, type GoogleBookVolume } from "@/lib/google-books";

export function SearchResultCard({
  book,
  action,
  extraFields,
  buttonLabel,
}: {
  book: GoogleBookVolume;
  action: (formData: FormData) => void | Promise<void>;
  extraFields?: Record<string, string>;
  buttonLabel: string;
}) {
  const thumbnail = secureThumbnail(book.volumeInfo.imageLinks?.thumbnail);
  const authors = book.volumeInfo.authors?.join(", ");

  return (
    <div className="flex flex-col gap-2">
      <BookCover src={thumbnail} alt={book.volumeInfo.title} />
      <div className="flex flex-col gap-0.5">
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {book.volumeInfo.title}
        </p>
        {authors && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {authors}
          </p>
        )}
      </div>
      <form action={action}>
        <input type="hidden" name="googleVolumeId" value={book.id} />
        <input type="hidden" name="title" value={book.volumeInfo.title} />
        <input type="hidden" name="authors" value={authors ?? ""} />
        <input
          type="hidden"
          name="description"
          value={book.volumeInfo.description ?? ""}
        />
        <input type="hidden" name="thumbnailUrl" value={thumbnail ?? ""} />
        <input
          type="hidden"
          name="publishedDate"
          value={book.volumeInfo.publishedDate ?? ""}
        />
        <input
          type="hidden"
          name="pageCount"
          value={book.volumeInfo.pageCount?.toString() ?? ""}
        />
        <input
          type="hidden"
          name="averageRating"
          value={book.volumeInfo.averageRating?.toString() ?? ""}
        />
        <input
          type="hidden"
          name="categories"
          value={book.volumeInfo.categories?.join("|") ?? ""}
        />
        {extraFields &&
          Object.entries(extraFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        <Button type="submit" size="sm" variant="outline" className="w-full">
          {buttonLabel}
        </Button>
      </form>
    </div>
  );
}
