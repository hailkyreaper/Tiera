"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";
import { containsBadWord } from "@/lib/bad-words";

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
    assertNoSupabaseError(
      await supabase
        .from("list_likes")
        .delete()
        .eq("tier_list_id", tierListId)
        .eq("user_id", user.id),
      "unliking list",
    );
  } else {
    // upsert + ignoreDuplicates, not a plain insert — same stale-state/
    // double-click reasoning as toggleFollow (u/actions.ts). Postgres
    // skips the AFTER INSERT trigger for a conflict-ignored row, so
    // like_count still can't double-increment from this.
    assertNoSupabaseError(
      await supabase
        .from("list_likes")
        .upsert(
          { tier_list_id: tierListId, user_id: user.id },
          { onConflict: "tier_list_id,user_id", ignoreDuplicates: true },
        ),
      "liking list",
    );
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

  // Same silent no-op as an empty body — this form has no error-display
  // mechanism (a plain <form action>, no useActionState), unlike the
  // onboarding username field's dedicated page with a `?error=` param, so
  // there's nothing sensible to redirect to from an inline comment box.
  if (!body || containsBadWord(body)) {
    return;
  }

  assertNoSupabaseError(
    await supabase
      .from("list_comments")
      .insert({ tier_list_id: tierListId, user_id: user.id, body }),
    "posting comment",
  );

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

  assertNoSupabaseError(
    await supabase
      .from("list_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id),
    "deleting comment",
  );

  revalidatePath(`/lists/${tierListId}`);
}
