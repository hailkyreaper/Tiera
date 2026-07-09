import { BookCover } from "@/components/book-cover";
import { AddBookButton } from "@/components/add-book-button";
import { bookFormFields, secureThumbnail, type GoogleBookVolume } from "@/lib/google-books";

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
  const publishedYear = book.volumeInfo.publishedDate?.slice(0, 4);
  const fields = { ...bookFormFields(book), ...extraFields };

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
