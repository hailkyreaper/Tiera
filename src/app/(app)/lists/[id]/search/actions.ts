"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookFieldsFromFormData, findOrCreateBook, searchBooks } from "@/lib/db/books";
import type { GoogleBookVolume } from "@/lib/google-books";

// Backs the live typeahead dropdown in BookSearchInput — same underlying
// search as the full Enter-to-submit results, just capped smaller for a
// compact dropdown.
export async function searchBooksLive(query: string): Promise<GoogleBookVolume[]> {
  if (!query.trim()) {
    return [];
  }
  const supabase = await createClient();
  const results = await searchBooks(supabase, query);
  return results.slice(0, 6);
}

// Same as addSearchResultToList, but stays on the search page (instead of
// redirecting into the list) so you can quickly add several books in a row.
export async function addToUnrankedAndStay(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierListId = formData.get("tierListId") as string;
  const q = (formData.get("q") as string) ?? "";
  const bookId = await findOrCreateBook(supabase, bookFieldsFromFormData(formData));

  if (!bookId) {
    return;
  }

  await supabase
    .from("user_books")
    .upsert(
      { user_id: user.id, book_id: bookId },
      { onConflict: "user_id,book_id", ignoreDuplicates: true },
    );

  await supabase
    .from("tier_list_items")
    .upsert(
      { tier_list_id: tierListId, book_id: bookId, tier: "unranked" },
      { onConflict: "tier_list_id,book_id" },
    );

  revalidatePath(`/lists/${tierListId}/search?q=${encodeURIComponent(q)}`);
  // Bumps tier_lists.updated_at via the tier_list_items trigger (migration
  // 0024) even though it lands in Unranked — Explore's Recent sort should
  // still pick that up immediately rather than waiting on some other
  // unrelated revalidation to catch it.
  revalidatePath("/explore");
}
