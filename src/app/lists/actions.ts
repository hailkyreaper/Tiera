"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookFieldsFromFormData, findOrCreateBook } from "@/lib/db/books";

type IdRow = { id: string };

export async function createTierList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = (formData.get("title") as string) || "My Tier List";

  const { data, error } = await supabase
    .from("tier_lists")
    .insert({ user_id: user.id, title })
    .select("id")
    .single<IdRow>();

  if (error || !data) {
    return;
  }

  redirect(`/lists/${data.id}`);
}

export async function setListVisibility(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierListId = formData.get("tierListId") as string;
  const isPublic = formData.get("isPublic") === "true";

  await supabase
    .from("tier_lists")
    .update({ is_public: isPublic })
    .eq("id", tierListId);

  revalidatePath(`/lists/${tierListId}`);
  revalidatePath("/lists");
}

export async function addSearchResultToList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tierListId = formData.get("tierListId") as string;
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

  redirect(`/lists/${tierListId}`);
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

export async function removeBookFromList(itemId: string, tierListId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase.from("tier_list_items").delete().eq("id", itemId);
  revalidatePath(`/lists/${tierListId}`);
}

export async function removeFromLibrary(bookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myLists } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("user_id", user.id);

  const listIds = (myLists ?? []).map((list) => list.id);

  if (listIds.length > 0) {
    await supabase
      .from("tier_list_items")
      .delete()
      .eq("book_id", bookId)
      .in("tier_list_id", listIds);
  }

  await supabase
    .from("user_books")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);

  revalidatePath("/lists", "layout");
}
