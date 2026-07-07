import type { createClient } from "@/lib/supabase/server";
import { normalizeCategory } from "@/lib/google-books";
import { getOpenLibraryData } from "@/lib/open-library";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type BookIdRow = { id: string };

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
