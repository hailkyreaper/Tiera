"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addBooksToUnranked(
  tierListId: string,
  bookIds: string[],
) {
  if (bookIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase.from("tier_list_items").upsert(
    bookIds.map((bookId) => ({
      tier_list_id: tierListId,
      book_id: bookId,
      tier: "unranked",
    })),
    { onConflict: "tier_list_id,book_id" },
  );

  revalidatePath(`/lists/${tierListId}/library`);
  // Same tier_list_items -> tier_lists.updated_at trigger as
  // addToUnrankedAndStay (migration 0024) — keep Explore's Recent sort fresh.
  revalidatePath("/explore");
}
