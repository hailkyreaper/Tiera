"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleLike(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierListId = formData.get("tierListId") as string;
  const isLiked = formData.get("isLiked") === "true";

  if (isLiked) {
    await supabase
      .from("list_likes")
      .delete()
      .eq("tier_list_id", tierListId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("list_likes")
      .insert({ tier_list_id: tierListId, user_id: user.id });
  }

  revalidatePath(`/lists/${tierListId}`);
}

export async function addComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierListId = formData.get("tierListId") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!body) {
    return;
  }

  await supabase
    .from("list_comments")
    .insert({ tier_list_id: tierListId, user_id: user.id, body });

  revalidatePath(`/lists/${tierListId}`);
}

export async function deleteComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const commentId = formData.get("commentId") as string;
  const tierListId = formData.get("tierListId") as string;

  await supabase
    .from("list_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidatePath(`/lists/${tierListId}`);
}
