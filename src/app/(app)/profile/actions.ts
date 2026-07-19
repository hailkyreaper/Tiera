"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = (formData.get("displayName") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;

  await supabase
    .from("profiles")
    .update({ display_name: displayName, bio, location })
    .eq("id", user.id);

  const file = formData.get("avatar") as File | null;

  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      redirect(
        `/profile?edit=true&error=${encodeURIComponent("Please choose an image file.")}`,
      );
    }

    const extension = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      redirect(
        `/profile?edit=true&error=${encodeURIComponent("Upload failed. Try a smaller image.")}`,
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase
      .from("profiles")
      .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
      .eq("id", user.id);
  }

  redirect("/profile");
}

export async function removeBooksFromLibrary(bookIds: string[]) {
  if (bookIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("user_books")
    .delete()
    .eq("user_id", user.id)
    .in("book_id", bookIds);

  revalidatePath("/profile");
}

// Clears want_to_read only — the book stays in the library either way, this
// just takes it out of the "To Be Read" shelf (e.g. once they've actually
// read/ranked it, or just don't want it queued anymore).
export async function clearWantToRead(bookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("user_books")
    .update({ want_to_read: false })
    .eq("user_id", user.id)
    .eq("book_id", bookId);

  revalidatePath("/profile");
}

// Persists a drag-reordered Custom Order. No revalidatePath here on
// purpose — the caller already holds the new order in optimistic client
// state (that's what's actually rendered mid-drag and after), so
// revalidating here would just refetch and risk visually snapping the
// grid back before the DB write is even confirmed. Same position-bulk-
// update shape as reorderTierItems (lists/actions.ts), keyed by
// user_id+book_id instead of a tier_list_items row id since LibraryBook has
// no separate row id of its own.
export async function reorderLibraryBooks(bookIds: string[]) {
  if (bookIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await Promise.all(
    bookIds.map((bookId, index) =>
      supabase
        .from("user_books")
        .update({ position: index })
        .eq("user_id", user.id)
        .eq("book_id", bookId),
    ),
  );
}
