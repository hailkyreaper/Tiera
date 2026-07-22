"use server";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";
import { isAdmin } from "@/lib/auth/admin";
import { normalizeCategory } from "@/lib/google-books";
import {
  extractOpenLibraryWorkKey,
  fetchOpenLibraryDataByWorkKey,
  getOpenLibraryData,
} from "@/lib/open-library";
import { mapWithConcurrency } from "@/lib/concurrency";

type BookRow = {
  id: string;
  google_volume_id: string;
  title: string;
  authors: string[] | null;
  thumbnail_url: string | null;
  description: string | null;
  published_date: string | null;
};
type VolumeResponse = { volumeInfo?: { categories?: string[] } };

export async function runBackfill() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!(await isAdmin(supabase, user.id))) {
    notFound();
  }

  // Re-checks every book (not just ones missing categories/covers), since
  // Open Library's data is often better than what Google Books already gave
  // us for a book.
  const books = assertNoSupabaseError(
    await supabase
      .from("books")
      .select(
        "id, google_volume_id, title, authors, thumbnail_url, description, published_date",
      )
      .returns<BookRow[]>(),
    "fetching books for admin backfill",
  );

  type BackfillOutcome = {
    updated: boolean;
    coverFilled: boolean;
    descriptionFilled: boolean;
    publishedDateFilled: boolean;
    failed: boolean;
    noCategories: boolean;
  };

  // Previously a plain sequential for-of loop — 1-3 external API calls
  // (Open Library, sometimes Google Books) per book, one at a time, over
  // the *entire* catalog. Same serverless-timeout risk already identified
  // and fixed for Goodreads/AI import (see CLAUDE.md), just missed here:
  // this genuinely re-scans every book, not just ones missing data, so it
  // grows with the whole catalog, not just new additions. Bounded to 6 at
  // a time via the same mapWithConcurrency pool those imports use.
  const outcomes = await mapWithConcurrency(
    books ?? [],
    6,
    async (book): Promise<BackfillOutcome> => {
    try {
      // Prefer an exact lookup by the work id we already have on file over
      // a fresh title+author text search — strictly more reliable (no
      // relevance ranking to get wrong), and the only way to recover books
      // whose search doesn't reliably surface the right work at all.
      // Confirmed live: several already-known-by-key books (short/common
      // titles like "It", "Circe", "Piranesi") never got a description
      // from the search-based lookup despite Open Library clearly having
      // real description text once fetched directly by key.
      const workKey = extractOpenLibraryWorkKey(book.google_volume_id);
      const openLibrary = workKey
        ? await fetchOpenLibraryDataByWorkKey(workKey)
        : await getOpenLibraryData(book.title, book.authors?.[0], {
            includeDescription: !book.description,
          });

      let categories = openLibrary.genres;

      if (categories.length === 0) {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${book.google_volume_id}?key=${process.env.GOOGLE_BOOKS_API_KEY}`,
        );

        if (res.ok) {
          const data: VolumeResponse = await res.json();
          const rawCategories = data.volumeInfo?.categories ?? [];
          categories = [...new Set(rawCategories.map(normalizeCategory))];
        }
      }

      const updates: Record<string, unknown> = {};
      const outcome: BackfillOutcome = {
        updated: false,
        coverFilled: false,
        descriptionFilled: false,
        publishedDateFilled: false,
        failed: false,
        noCategories: false,
      };

      if (categories.length > 0) {
        updates.categories = categories;
      } else {
        outcome.noCategories = true;
      }

      if (!book.thumbnail_url && openLibrary.coverUrl) {
        updates.thumbnail_url = openLibrary.coverUrl;
        outcome.coverFilled = true;
      }

      if (!book.description && openLibrary.description) {
        updates.description = openLibrary.description;
        outcome.descriptionFilled = true;
      }

      if (!book.published_date && openLibrary.publishedDate) {
        updates.published_date = openLibrary.publishedDate;
        outcome.publishedDateFilled = true;
      }

      if (Object.keys(updates).length === 0) {
        return outcome;
      }

      const { error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", book.id);

      outcome.updated = !error;
      outcome.failed = !!error;
      return outcome;
    } catch {
      return {
        updated: false,
        coverFilled: false,
        descriptionFilled: false,
        publishedDateFilled: false,
        failed: true,
        noCategories: false,
      };
    }
    },
  );

  let updated = 0;
  let coversFilled = 0;
  let descriptionsFilled = 0;
  let publishedDatesFilled = 0;
  let failed = 0;
  let noCategories = 0;
  for (const outcome of outcomes) {
    if (outcome.updated) updated++;
    if (outcome.coverFilled) coversFilled++;
    if (outcome.descriptionFilled) descriptionsFilled++;
    if (outcome.publishedDateFilled) publishedDatesFilled++;
    if (outcome.failed) failed++;
    if (outcome.noCategories) noCategories++;
  }

  const message = `Updated ${updated} book(s) (${coversFilled} covers filled in, ${descriptionsFilled} descriptions filled in, ${publishedDatesFilled} published dates filled in), ${failed} failed, ${noCategories} had no categories available.`;
  redirect(
    `/admin/backfill-categories?result=${encodeURIComponent(message)}`,
  );
}
