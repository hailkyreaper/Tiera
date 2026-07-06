"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookFieldsFromFormData, findOrCreateBook } from "@/lib/db/books";

export async function addBookToLibrary(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bookId = await findOrCreateBook(
    supabase,
    bookFieldsFromFormData(formData),
  );

  if (!bookId) {
    return;
  }

  await supabase
    .from("user_books")
    .upsert(
      { user_id: user.id, book_id: bookId },
      { onConflict: "user_id,book_id", ignoreDuplicates: true },
    );

  revalidatePath("/search");
}
