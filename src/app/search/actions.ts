"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type BookIdRow = { id: string };

export async function addBookToLibrary(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const googleVolumeId = formData.get("googleVolumeId") as string;
  const title = formData.get("title") as string;
  const authors = formData.get("authors") as string;
  const description = formData.get("description") as string;
  const thumbnailUrl = formData.get("thumbnailUrl") as string;
  const publishedDate = formData.get("publishedDate") as string;
  const pageCount = formData.get("pageCount") as string;
  const averageRating = formData.get("averageRating") as string;

  const { data: existingBook } = await supabase
    .from("books")
    .select("id")
    .eq("google_volume_id", googleVolumeId)
    .maybeSingle<BookIdRow>();

  let bookId = existingBook?.id;

  if (!bookId) {
    const { data: newBook, error: insertError } = await supabase
      .from("books")
      .insert({
        google_volume_id: googleVolumeId,
        title,
        authors: authors ? authors.split(", ") : null,
        description: description || null,
        thumbnail_url: thumbnailUrl || null,
        published_date: publishedDate || null,
        page_count: pageCount ? parseInt(pageCount, 10) : null,
        average_rating: averageRating ? parseFloat(averageRating) : null,
      })
      .select("id")
      .single<BookIdRow>();

    if (insertError || !newBook) {
      return;
    }
    bookId = newBook.id;
  }

  await supabase
    .from("user_books")
    .upsert(
      { user_id: user.id, book_id: bookId },
      { onConflict: "user_id,book_id", ignoreDuplicates: true },
    );

  revalidatePath("/search");
}
