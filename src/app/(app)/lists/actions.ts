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

// Shared by updateListDetails and the "save and go to search/library"
// actions below — the title/visibility fields live in client state and are
// otherwise lost the instant you navigate to a different route (which
// Search Books / Add from Library both are), since nothing had ever
// submitted them yet.
async function saveListFields(formData: FormData): Promise<string> {
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

  return tierListId;
}

export async function updateListDetails(formData: FormData) {
  const tierListId = await saveListFields(formData);
  revalidatePath(`/lists/${tierListId}`);
  redirect(`/lists/${tierListId}`);
}

export async function saveAndGoToSearch(formData: FormData) {
  const tierListId = await saveListFields(formData);
  redirect(`/lists/${tierListId}/search`);
}

export async function saveAndGoToLibrary(formData: FormData) {
  const tierListId = await saveListFields(formData);
  redirect(`/lists/${tierListId}/library`);
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
  revalidateCompare();
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
  revalidateCompare();
}

// Ranking a book (or moving it between tiers) changes the score
// computeMatch uses, which every Compare page depends on — but those are
// separate routes revalidatePath(`/lists/${id}`) above never touches.
// Compare/[username] is a dynamic route, so revalidating it needs the
// 'page' type to cover every username, not just one specific instance.
function revalidateCompare() {
  revalidatePath("/compare");
  revalidatePath("/compare/[username]", "page");
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

