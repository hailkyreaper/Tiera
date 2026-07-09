"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addFromLibraryAndStay(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierListId = formData.get("tierListId") as string;
  const bookId = formData.get("bookId") as string;

  await supabase
    .from("tier_list_items")
    .upsert(
      { tier_list_id: tierListId, book_id: bookId, tier: "unranked" },
      { onConflict: "tier_list_id,book_id" },
    );

  revalidatePath(`/lists/${tierListId}/library`);
}
