"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";

export async function toggleFollow(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const targetUserId = formData.get("targetUserId") as string;
  const isFollowing = formData.get("isFollowing") === "true";
  const username = formData.get("username") as string;

  if (isFollowing) {
    assertNoSupabaseError(
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId),
      "unfollowing user",
    );
  } else {
    // upsert + ignoreDuplicates, not a plain insert — a stale isFollowing
    // value (double-click, stale client cache) hitting the (follower_id,
    // following_id) primary key would otherwise throw a real "duplicate
    // key" error even though the desired end state ("you follow them") is
    // already true. Same pattern user_books already uses for exactly this
    // reason (see addBookToLibrary).
    assertNoSupabaseError(
      await supabase
        .from("follows")
        .upsert(
          { follower_id: user.id, following_id: targetUserId },
          { onConflict: "follower_id,following_id", ignoreDuplicates: true },
        ),
      "following user",
    );
  }

  if (username) {
    revalidatePath(`/u/${username}`);
  }
  revalidatePath("/profile");
  revalidatePath("/profile/following");
}
