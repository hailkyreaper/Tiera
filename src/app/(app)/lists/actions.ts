"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function parseTags(raw: string): string[] | null {
  const tags = raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : null;
}

export async function updateListDetails(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierListId = formData.get("tierListId") as string;
  const title = (formData.get("title") as string)?.trim() || "My Tier List";
  const description = (formData.get("description") as string)?.trim() || null;
  const tags = parseTags((formData.get("tags") as string) ?? "");
  const isPublic = formData.get("isPublic") === "true";

  await supabase
    .from("tier_lists")
    .update({ title, description, tags, is_public: isPublic, is_draft: false })
    .eq("id", tierListId)
    .eq("user_id", user.id);

  revalidatePath(`/lists/${tierListId}`);
  redirect(`/lists/${tierListId}`);
}

// Cancel on a still-unsaved draft discards it entirely (any books already
// added cascade-delete with it) instead of leaving an orphaned row that
// never shows up anywhere. If it's not a draft (an already-saved list being
// edited), the delete matches nothing and Cancel just navigates back.
export async function cancelListEdit(tierListId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: deleted } = await supabase
    .from("tier_lists")
    .delete()
    .eq("id", tierListId)
    .eq("user_id", user.id)
    .eq("is_draft", true)
    .select("id");

  if (deleted && deleted.length > 0) {
    redirect("/profile");
  }

  redirect(`/lists/${tierListId}`);
}

export async function deleteTierList(tierListId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("tier_lists")
    .delete()
    .eq("id", tierListId)
    .eq("user_id", user.id);

  redirect("/profile");
}

export async function addBookToTier(
  tierListId: string,
  bookId: string,
  tier: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("tier_list_items")
    .upsert(
      { tier_list_id: tierListId, book_id: bookId, tier },
      { onConflict: "tier_list_id,book_id" },
    );

  revalidatePath(`/lists/${tierListId}`);
}

export async function moveBookToTier(
  itemId: string,
  tierListId: string,
  tier: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase.from("tier_list_items").update({ tier }).eq("id", itemId);
  revalidatePath(`/lists/${tierListId}`);
}

export async function reorderTierItems(
  tierListId: string,
  orderedItemIds: string[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await Promise.all(
    orderedItemIds.map((itemId, index) =>
      supabase
        .from("tier_list_items")
        .update({ position: index })
        .eq("id", itemId),
    ),
  );

  revalidatePath(`/lists/${tierListId}`);
}

