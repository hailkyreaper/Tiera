"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleSavedMatch(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const savedUserId = formData.get("savedUserId") as string;
  const username = formData.get("username") as string;
  const isSaved = formData.get("isSaved") === "true";

  if (isSaved) {
    const { error } = await supabase
      .from("saved_matches")
      .delete()
      .eq("viewer_id", user.id)
      .eq("saved_user_id", savedUserId);
    if (error) console.error("toggleSavedMatch delete failed:", error);
  } else {
    const { error } = await supabase
      .from("saved_matches")
      .insert({ viewer_id: user.id, saved_user_id: savedUserId });
    if (error) console.error("toggleSavedMatch insert failed:", error);
  }

  revalidatePath(`/compare/${username}`);
}
