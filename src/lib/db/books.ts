import type { createClient } from "@/lib/supabase/server";
import { normalizeCategory, searchGoogleBooks, type GoogleBookVolume } from "@/lib/google-books";
import { getOpenLibraryData } from "@/lib/open-library";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type BookIdRow = { id: string };

type LocalBookRow = {
  google_volume_id: string;
  title: string;
  authors: string[] | null;
  description: string | null;
  thumbnail_url: string | null;
  published_date: string | null;
  page_count: number | null;
  average_rating: number | null;
  categories: string[] | null;
};

export type BookFields = {
  googleVolumeId: string;
  title: string;
  authors: string;
  description: string;
  thumbnailUrl: string;
  publishedDate: string;
  pageCount: string;
  averageRating: string;
  categories: string;
};

export function bookFieldsFromFormData(formData: FormData): BookFields {
  return {
    googleVolumeId: formData.get("googleVolumeId") as string,
    title: formData.get("title") as string,
    authors: (formData.get("authors") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
    thumbnailUrl: (formData.get("thumbnailUrl") as string) ?? "",
    publishedDate: (formData.get("publishedDate") as string) ?? "",
    pageCount: (formData.get("pageCount") as string) ?? "",
    averageRating: (formData.get("averageRating") as string) ?? "",
    categories: (formData.get("categories") as string) ?? "",
  };
}

export async function findOrCreateBook(
  supabase: SupabaseServerClient,
  fields: BookFields,
): Promise<string | null> {
  const { data: existingBook } = await supabase
    .from("books")
    .select("id")
    .eq("google_volume_id", fields.googleVolumeId)
    .maybeSingle<BookIdRow>();

  if (existingBook) {
    return existingBook.id;
  }

  const googleCategories = fields.categories
    ? [...new Set(fields.categories.split("|").map(normalizeCategory))]
    : [];

  const firstAuthor = fields.authors ? fields.authors.split(", ")[0] : undefined;
  const openLibrary = await getOpenLibraryData(fields.title, firstAuthor);
  const categories =
    openLibrary.genres.length > 0 ? openLibrary.genres : googleCategories;

  const { data: newBook, error } = await supabase
    .from("books")
    .insert({
      google_volume_id: fields.googleVolumeId,
      title: fields.title,
      authors: fields.authors ? fields.authors.split(", ") : null,
      description: fields.description || null,
      thumbnail_url: fields.thumbnailUrl || openLibrary.coverUrl || null,
      published_date: fields.publishedDate || null,
      page_count: fields.pageCount ? parseInt(fields.pageCount, 10) : null,
      average_rating: fields.averageRating
        ? parseFloat(fields.averageRating)
        : null,
      categories: categories.length > 0 ? categories : null,
    })
    .select("id")
    .single<BookIdRow>();

  if (error || !newBook) {
    return null;
  }

  return newBook.id;
}

function localBookToVolume(row: LocalBookRow): GoogleBookVolume {
  return {
    id: row.google_volume_id,
    volumeInfo: {
      title: row.title,
      authors: row.authors ?? undefined,
      description: row.description ?? undefined,
      publishedDate: row.published_date ?? undefined,
      pageCount: row.page_count ?? undefined,
      averageRating: row.average_rating ?? undefined,
      categories: row.categories ?? undefined,
      imageLinks: row.thumbnail_url
        ? { thumbnail: row.thumbnail_url }
        : undefined,
    },
  };
}

// Every book anyone has ever added already lives in our own `books` table
// (via findOrCreateBook above) — searching it first means a book someone's
// already added stays reliably searchable even when Google's API is slow or
// down, since it doesn't depend on a live external call at all.
export async function searchLocalBooks(
  supabase: SupabaseServerClient,
  query: string,
  limit = 10,
): Promise<GoogleBookVolume[]> {
  const { data } = await supabase
    .from("books")
    .select(
      "google_volume_id, title, authors, description, thumbnail_url, published_date, page_count, average_rating, categories",
    )
    .ilike("title", `%${query}%`)
    .limit(limit)
    .returns<LocalBookRow[]>();

  return (data ?? []).map(localBookToVolume);
}

// Local results are ranked first (already vetted by real use in the app,
// and free of any dependency on Google's API being up), then the live
// Google search results are merged in after, deduped by volume id.
export async function searchBooks(
  supabase: SupabaseServerClient,
  query: string,
  limit = 20,
): Promise<GoogleBookVolume[]> {
  const [localResults, googleResults] = await Promise.all([
    searchLocalBooks(supabase, query, limit),
    searchGoogleBooks(query, limit),
  ]);

  const seen = new Set<string>();
  const merged: GoogleBookVolume[] = [];
  for (const book of [...localResults, ...googleResults]) {
    if (!seen.has(book.id)) {
      seen.add(book.id);
      merged.push(book);
    }
  }

  return merged.slice(0, limit);
}
