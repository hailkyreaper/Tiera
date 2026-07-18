"use server";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { normalizeCategory } from "@/lib/google-books";
import { getOpenLibraryData } from "@/lib/open-library";

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
  const { data: books } = await supabase
    .from("books")
    .select(
      "id, google_volume_id, title, authors, thumbnail_url, description, published_date",
    )
    .returns<BookRow[]>();

  let updated = 0;
  let coversFilled = 0;
  let descriptionsFilled = 0;
  let publishedDatesFilled = 0;
  let failed = 0;
  let noCategories = 0;

  for (const book of books ?? []) {
    try {
      const openLibrary = await getOpenLibraryData(book.title, book.authors?.[0], {
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

      if (categories.length > 0) {
        updates.categories = categories;
      } else {
        noCategories++;
      }

      if (!book.thumbnail_url && openLibrary.coverUrl) {
        updates.thumbnail_url = openLibrary.coverUrl;
        coversFilled++;
      }

      if (!book.description && openLibrary.description) {
        updates.description = openLibrary.description;
        descriptionsFilled++;
      }

      if (!book.published_date && openLibrary.publishedDate) {
        updates.published_date = openLibrary.publishedDate;
        publishedDatesFilled++;
      }

      if (Object.keys(updates).length === 0) {
        continue;
      }

      const { error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", book.id);

      if (error) {
        failed++;
      } else {
        updated++;
      }
    } catch {
      failed++;
    }
  }

  const message = `Updated ${updated} book(s) (${coversFilled} covers filled in, ${descriptionsFilled} descriptions filled in, ${publishedDatesFilled} published dates filled in), ${failed} failed, ${noCategories} had no categories available.`;
  redirect(
    `/admin/backfill-categories?result=${encodeURIComponent(message)}`,
  );
}
