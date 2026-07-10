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
