import Link from "next/link";
import { addBookToLibrary } from "./actions";
import { searchGoogleBooks } from "@/lib/google-books";
import { createClient } from "@/lib/supabase/server";
import { SearchResultCard } from "@/components/search-result-card";
import { SegmentedTabs } from "@/components/segmented-tabs";
import { UsernameAutocomplete } from "@/components/username-autocomplete";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchType = "books" | "people";
type ProfileRow = { id: string; username: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type: rawType } = await searchParams;
  const type: SearchType = rawType === "people" ? "people" : "books";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Search</h1>

      <SegmentedTabs
        basePath="/search"
        paramName="type"
        tabs={[
          { value: "books", label: "Books" },
          { value: "people", label: "People" },
        ]}
        current={type}
      />

      {type === "books" ? (
        <BookSearch q={q} />
      ) : (
        <PeopleSearch q={q} />
      )}
    </div>
  );
}

async function BookSearch({ q }: { q?: string }) {
  const books = q ? await searchGoogleBooks(q) : [];

  return (
    <>
      <form className="flex gap-2">
        <input type="hidden" name="type" value="books" />
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
            layout="grid"
          />
        ))}
      </div>
    </>
  );
}

async function PeopleSearch({ q }: { q?: string }) {
  let people: ProfileRow[] = [];

  if (q) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${q}%`)
      .limit(20)
      .returns<ProfileRow[]>();
    people = data ?? [];
  }

  return (
    <>
      <form className="flex gap-2">
        <input type="hidden" name="type" value="people" />
        <UsernameAutocomplete defaultValue={q} />
        <Button type="submit">Search</Button>
      </form>

      {q && people.length === 0 && (
        <p className="text-muted-foreground">
          No users found for &quot;{q}&quot;.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/u/${person.username}`}
            className="rounded-sm bg-card p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            @{person.username}
          </Link>
        ))}
      </div>
    </>
  );
}
