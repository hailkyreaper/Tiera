import Link from "next/link";
import { addBookToLibrary } from "./actions";
import { searchBooks } from "@/lib/db/books";
import { getAllGenres } from "@/lib/db/discovery";
import { logSearchQuery } from "@/lib/db/search-queries";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";
import { SearchResultCard } from "@/components/search-result-card";
import { SegmentedTabs } from "@/components/segmented-tabs";
import { UsernameAutocomplete } from "@/components/username-autocomplete";
import { BookSearchForm } from "@/components/book-search-form";
import { TrendingSearchesRail } from "@/components/trending-searches-rail";
import { SearchFiltersPanel } from "@/components/search-filters-panel";
import type { GoogleBookVolume } from "@/lib/google-books";

type SearchType = "books" | "people";
type ProfileRow = { id: string; username: string };

type BookFilters = {
  genre?: string;
  minRating?: string;
  years?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    genre?: string;
    minRating?: string;
    years?: string;
  }>;
}) {
  const { q, type: rawType, genre, minRating, years } = await searchParams;
  const type: SearchType = rawType === "people" ? "people" : "books";

  return (
    <div className="flex w-full flex-1 gap-6 p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 lg:max-w-3xl xl:max-w-4xl">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Search
        </h1>

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
          <BookSearch q={q} filters={{ genre, minRating, years }} />
        ) : (
          <PeopleSearch q={q} />
        )}
      </div>

      {type === "books" && (
        <aside className="sticky top-4 hidden h-fit w-96 shrink-0 flex-col gap-4 xl:flex">
          <SearchFiltersPanelWithGenres />
          <TrendingSearchesRail />
        </aside>
      )}
    </div>
  );
}

async function SearchFiltersPanelWithGenres() {
  const supabase = await createClient();
  const genres = await getAllGenres(supabase);
  return <SearchFiltersPanel genres={genres} />;
}

function applyBookFilters(
  books: GoogleBookVolume[],
  { genre, minRating, years }: BookFilters,
): GoogleBookVolume[] {
  const minRatingValue = minRating ? parseFloat(minRating) : undefined;
  const minYearsValue = years ? parseInt(years, 10) : undefined;
  const cutoffYear = minYearsValue
    ? new Date().getFullYear() - minYearsValue + 1
    : undefined;

  return books.filter((book) => {
    if (genre && !book.volumeInfo.categories?.includes(genre)) {
      return false;
    }
    if (
      minRatingValue !== undefined &&
      (book.volumeInfo.averageRating ?? 0) < minRatingValue
    ) {
      return false;
    }
    if (cutoffYear !== undefined) {
      const year = book.volumeInfo.publishedDate
        ? parseInt(book.volumeInfo.publishedDate.slice(0, 4), 10)
        : undefined;
      if (!year || year < cutoffYear) {
        return false;
      }
    }
    return true;
  });
}

async function BookSearch({
  q,
  filters,
}: {
  q?: string;
  filters: BookFilters;
}) {
  const supabase = await createClient();
  const rawBooks = q ? await searchBooks(supabase, q) : [];
  const books = applyBookFilters(rawBooks, filters);
  // Distinguishes "your filters excluded every match" from a genuine
  // catalog miss — without this, a search that actually found results but
  // filtered them all out looked identical to the book just not existing.
  const filteredToZero =
    Boolean(filters.genre || filters.minRating || filters.years) &&
    rawBooks.length > 0 &&
    books.length === 0;

  if (q) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logSearchQuery(supabase, q, user?.id ?? null);
  }

  return (
    <>
      <BookSearchForm
        basePath="/search"
        defaultValue={q}
        action={addBookToLibrary}
        extraParams={{ type: "books" }}
      />

      {q && books.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {filteredToZero
            ? `No results for "${q}" match your current filters — try loosening or resetting them.`
            : `No results for "${q}".`}
        </p>
      )}

      <div className="flex flex-col divide-y divide-border">
        {books.map((book) => (
          <SearchResultCard
            key={book.id}
            book={book}
            action={addBookToLibrary}
            buttonLabel="Add to My List"
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
    const data = assertNoSupabaseError(
      await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${q}%`)
        .limit(20)
        .returns<ProfileRow[]>(),
      "searching people",
    );
    people = data ?? [];
  }

  return (
    <>
      <form className="flex gap-2">
        <input type="hidden" name="type" value="people" />
        <UsernameAutocomplete defaultValue={q} />
      </form>

      {q && people.length === 0 && (
        <p className="text-sm text-muted-foreground">
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
