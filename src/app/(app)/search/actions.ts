"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError, logSupabaseError } from "@/lib/supabase/assert";
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

  // The "Add" button previously had no way to know its write actually
  // failed — the upsert's error was never checked, so a failure looked
  // identical to success from the user's side. Throwing here at least
  // surfaces it instead of silently pretending the book was added.
  assertNoSupabaseError(
    await supabase
      .from("user_books")
      .upsert(
        { user_id: user.id, book_id: bookId },
        { onConflict: "user_id,book_id", ignoreDuplicates: true },
      ),
    "adding book to library",
  );

  revalidatePath("/search");
}

export async function searchUsernames(
  query: string,
): Promise<{ id: string; username: string }[]> {
  if (!query.trim()) {
    return [];
  }

  const supabase = await createClient();
  const data = logSupabaseError(
    await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${query}%`)
      .limit(8)
      .returns<{ id: string; username: string }[]>(),
    "searching usernames",
    [],
  );

  return data ?? [];
}
