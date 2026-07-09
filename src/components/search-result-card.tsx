import { BookCover } from "@/components/book-cover";
import { AddBookButton } from "@/components/add-book-button";
import { bookFormFields, secureThumbnail, type GoogleBookVolume } from "@/lib/google-books";

export function SearchResultCard({
  book,
  action,
  extraFields,
  buttonLabel,
  layout = "list",
}: {
  book: GoogleBookVolume;
  action: (formData: FormData) => void | Promise<void>;
  extraFields?: Record<string, string>;
  buttonLabel: string;
  /** "list" (default, Goodreads-style row: small cover left, details + Add
   * right) or "grid" (explicitly opted into by the general /search page). */
  layout?: "grid" | "list";
}) {
  const thumbnail = secureThumbnail(book.volumeInfo.imageLinks?.thumbnail);
  const authors = book.volumeInfo.authors?.join(", ");
  const publishedYear = book.volumeInfo.publishedDate?.slice(0, 4);
  const fields = { ...bookFormFields(book), ...extraFields };

  if (layout === "list") {
    return (
      <div className="flex gap-3 py-3">
        <div className="w-20 shrink-0">
          <BookCover src={thumbnail} alt={book.volumeInfo.title} size={80} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {book.volumeInfo.title}
          </p>
          {authors && (
            <p className="text-xs text-muted-foreground">by {authors}</p>
          )}
          {publishedYear && (
            <p className="text-xs text-muted-foreground">
              Published {publishedYear}
            </p>
          )}
          <div className="mt-1">
            <AddBookButton action={action} fields={fields} label={buttonLabel} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <BookCover src={thumbnail} alt={book.volumeInfo.title} />
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {book.volumeInfo.title}
        </p>
        {authors && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {authors}
          </p>
        )}
        {publishedYear && (
          <p className="text-xs text-muted-foreground">{publishedYear}</p>
        )}
      </div>
      <AddBookButton
        action={action}
        fields={fields}
        label={buttonLabel}
        className="w-full"
      />
    </div>
  );
}
