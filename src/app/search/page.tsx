import Image from "next/image";
import Link from "next/link";
import { addBookToLibrary } from "./actions";
import { searchGoogleBooks, secureThumbnail } from "@/lib/google-books";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const books = q ? await searchGoogleBooks(q) : [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Search books</h1>

      <form className="flex gap-2">
        <Input
          name="q"
          type="search"
          placeholder="Search by title, author..."
          defaultValue={q}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      {q && books.length === 0 && (
        <p className="text-muted-foreground">
          No results for &quot;{q}&quot;.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {books.map((book) => {
          const thumbnail = secureThumbnail(
            book.volumeInfo.imageLinks?.thumbnail,
          );
          const authors = book.volumeInfo.authors?.join(", ");

          return (
            <div key={book.id} className="flex flex-col gap-2">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={book.volumeInfo.title}
                  width={200}
                  height={300}
                  className="h-auto w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="flex aspect-2/3 w-full items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground">
                  No cover
                </div>
              )}
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

              {user ? (
                <form action={addBookToLibrary}>
                  <input
                    type="hidden"
                    name="googleVolumeId"
                    value={book.id}
                  />
                  <input
                    type="hidden"
                    name="title"
                    value={book.volumeInfo.title}
                  />
                  <input type="hidden" name="authors" value={authors ?? ""} />
                  <input
                    type="hidden"
                    name="description"
                    value={book.volumeInfo.description ?? ""}
                  />
                  <input
                    type="hidden"
                    name="thumbnailUrl"
                    value={thumbnail ?? ""}
                  />
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
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Add to library
                  </Button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="text-center text-xs text-primary underline underline-offset-4"
                >
                  Log in to save
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
