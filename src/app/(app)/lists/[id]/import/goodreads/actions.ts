"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseGoodreadsCsv, tierForRating } from "@/lib/goodreads-csv";
import { fetchCoverUrlByIsbn, getOpenLibraryData } from "@/lib/open-library";
import { mapWithConcurrency } from "@/lib/concurrency";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type BookIdRow = { id: string };

type BookMetadata = {
  coverUrl: string | null;
  categories: string[];
  publishedDate: string | null;
};

// Cover: ISBN-keyed edition lookup first (exact, unambiguous — no relevance
// ranking involved), falling back to the same title+author search doc used
// for genres/published date below. The search fallback strips anything
// after a colon — confirmed live that a long marketing subtitle (common on
// nonfiction, e.g. "Atomic Habits: An Easy & Proven Way to...") throws off
// Open Library's relevance ranking badly enough that it surfaces unrelated
// "Summary of..."/study-guide editions with no cover instead of the real
// book; the same search with just "Atomic Habits" finds it immediately.
//
// Categories/published date always come from the search-doc lookup (there's
// no ISBN-keyed equivalent for those) — every other import path
// (findOrCreateBook) sets these from Open Library, but this one originally
// didn't, which meant Search's Genre/Published filters silently dropped
// every Goodreads-imported book with no indication why.
async function resolveBookMetadata(
  isbn: string | null,
  title: string,
  author: string | null,
): Promise<BookMetadata> {
  const searchTitle = title.split(":")[0].trim();
  const [isbnCoverUrl, openLibrary] = await Promise.all([
    isbn ? fetchCoverUrlByIsbn(isbn) : Promise.resolve(null),
    getOpenLibraryData(searchTitle, author ?? undefined),
  ]);

  return {
    coverUrl: isbnCoverUrl ?? openLibrary.coverUrl,
    categories: openLibrary.genres,
    publishedDate: openLibrary.publishedDate,
  };
}

type GoodreadsImportRow = {
  title: string;
  author: string | null;
  isbn: string | null;
  averageRating: number | null;
};

const IMPORT_CONCURRENCY = 6;

// Checked in order: an exact match on the synthetic id this import gives a
// book (so re-importing the same CSV doesn't create duplicates), then a
// normalized title+author match (so a book already in the catalog from a
// search/add elsewhere doesn't get a second, duplicate row either — the same
// heuristic migration 0020 used to clean up existing duplicates, applied
// here at write-time instead of after the fact). DB-only (no Open Library
// calls), so callers can run this sequentially without it being the slow
// part.
async function findExistingBookId(
  supabase: SupabaseServerClient,
  row: GoodreadsImportRow,
): Promise<string | null> {
  try {
    const syntheticId = row.isbn ? `isbn:${row.isbn}` : null;

    if (syntheticId) {
      const { data: existingById } = await supabase
        .from("books")
        .select("id")
        .eq("google_volume_id", syntheticId)
        .maybeSingle<BookIdRow>();
      if (existingById) return existingById.id;
    }

    if (row.author) {
      const { data: existingByTitle } = await supabase
        .from("books")
        .select("id, title, authors")
        .ilike("title", row.title)
        .returns<{ id: string; title: string; authors: string[] | null }[]>();

      const match = (existingByTitle ?? []).find(
        (b) =>
          b.title.trim().toLowerCase() === row.title.trim().toLowerCase() &&
          (b.authors?.[0] ?? "").trim().toLowerCase() ===
            row.author!.trim().toLowerCase(),
      );
      if (match) return match.id;
    }

    return null;
  } catch {
    return null;
  }
}

// A stable key for "is this the same book" before it has a database row to
// match against yet — used to collapse the same new book appearing more
// than once in one CSV (Goodreads exports can contain a re-read row) down
// to a single create, the same way findExistingBookId would once it's
// actually in the catalog.
function dedupKey(row: GoodreadsImportRow): string {
  if (row.isbn) return `isbn:${row.isbn}`;
  return `title:${row.title.trim().toLowerCase()}|${(row.author ?? "").trim().toLowerCase()}`;
}

async function createGoodreadsBook(
  supabase: SupabaseServerClient,
  row: GoodreadsImportRow,
): Promise<string | null> {
  try {
    const { coverUrl, categories, publishedDate } = await resolveBookMetadata(
      row.isbn,
      row.title,
      row.author,
    );

    const { data: newBook, error } = await supabase
      .from("books")
      .insert({
        google_volume_id: row.isbn
          ? `isbn:${row.isbn}`
          : `goodreads:${crypto.randomUUID()}`,
        title: row.title,
        authors: row.author ? [row.author] : null,
        thumbnail_url: coverUrl,
        average_rating: row.averageRating,
        categories: categories.length > 0 ? categories : null,
        published_date: publishedDate,
        // Genuinely new catalog rows start unconfirmed — a tier_list_items
        // row has to reference a real book, so this can't wait until Save,
        // but staying is_draft keeps it out of everyone's search results
        // until the list is actually saved (saveListFields flips it back)
        // or gets garbage-collected if the draft is canceled instead
        // (cancelListEdit). Matched/existing rows never pass through here,
        // so this only ever marks genuinely fresh import rows.
        is_draft: true,
      })
      .select("id")
      .single<BookIdRow>();

    if (error || !newBook) return null;
    return newBook.id;
  } catch {
    return null;
  }
}

export async function importGoodreadsCsv(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierListId = formData.get("tierListId") as string;
  const autoTier = formData.get("autoTier") === "true";
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    redirect(
      `/lists/${tierListId}/import/goodreads?error=${encodeURIComponent("Choose a CSV file first.")}`,
    );
  }

  const text = await file.text();
  const rows = parseGoodreadsCsv(text);

  if (rows.length === 0) {
    redirect(
      `/lists/${tierListId}/import/goodreads?error=${encodeURIComponent("No books found in that file — make sure it's a Goodreads export CSV.")}`,
    );
  }

  // Phase 1: match every row against the existing catalog. Sequential and
  // DB-only (no Open Library calls, so it's fast) — has to stay sequential
  // rather than run through mapWithConcurrency, because two rows for the
  // same not-yet-created book could otherwise both see "doesn't exist yet"
  // at the same time and each create a duplicate row. Anything unmatched is
  // grouped by dedupKey so the same new book appearing twice in this CSV
  // still only gets created once.
  const matchedBookId: (string | null)[] = new Array(rows.length).fill(null);
  const newRowIndexesByKey = new Map<string, number[]>();

  for (let i = 0; i < rows.length; i++) {
    const existing = await findExistingBookId(supabase, rows[i]);
    if (existing) {
      matchedBookId[i] = existing;
    } else {
      const key = dedupKey(rows[i]);
      const indexes = newRowIndexesByKey.get(key) ?? [];
      indexes.push(i);
      newRowIndexesByKey.set(key, indexes);
    }
  }

  // Phase 2: create each genuinely new book once. This is the slow part —
  // Open Library's cover lookup — so it runs concurrently across a small
  // pool instead of one row at a time (see mapWithConcurrency above for
  // why). Safe to parallelize: each of these is a distinct new book with no
  // shared state, unlike phase 1's matching.
  const newKeys = [...newRowIndexesByKey.keys()];
  const createdBookIds = await mapWithConcurrency(
    newKeys,
    IMPORT_CONCURRENCY,
    (key) => createGoodreadsBook(supabase, rows[newRowIndexesByKey.get(key)![0]]),
  );

  newKeys.forEach((key, keyIndex) => {
    for (const rowIndex of newRowIndexesByKey.get(key)!) {
      matchedBookId[rowIndex] = createdBookIds[keyIndex];
    }
  });

  // Phase 3: place every resolved book onto the list. Independent per row
  // (no shared state, no ordering dependency), so this also runs
  // concurrently.
  //
  // Deliberately not added to user_books here — an import can bring in
  // hundreds of books at once, and none of them should land in the user's
  // actual library (or, for genuinely new rows, the shared catalog's
  // search results) until they choose to keep the list (Save).
  // saveListFields backfills user_books and clears is_draft from
  // tier_list_items when that happens; if they Cancel an unsaved draft
  // instead, cancelListEdit garbage-collects any still-is_draft,
  // now-unreferenced books this import created.
  await mapWithConcurrency(rows, IMPORT_CONCURRENCY, async (row, i) => {
    const bookId = matchedBookId[i];
    if (!bookId) return;

    const tier = autoTier ? tierForRating(row.myRating, row.dnf) : "unranked";

    try {
      await supabase
        .from("tier_list_items")
        .upsert(
          { tier_list_id: tierListId, book_id: bookId, tier },
          { onConflict: "tier_list_id,book_id" },
        );
    } catch {
      // A single row failing shouldn't sink the rest of the import.
    }
  });

  revalidatePath(`/lists/${tierListId}`);
  // Same tier_list_items -> tier_lists.updated_at trigger as the other
  // ranking mutations (migration 0024) — keep Explore's Recent sort fresh,
  // relevant if this import runs against an already-published list.
  revalidatePath("/explore");
  redirect(`/lists/${tierListId}?edit=true`);
}
