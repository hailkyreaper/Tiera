import { addBookToLibrary } from "./actions";
import { searchGoogleBooks } from "@/lib/google-books";
import { SearchResultCard } from "@/components/search-result-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const books = q ? await searchGoogleBooks(q) : [];

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
        {books.map((book) => (
          <SearchResultCard
            key={book.id}
            book={book}
            action={addBookToLibrary}
            buttonLabel="Add to library"
          />
        ))}
      </div>
    </div>
  );
}
