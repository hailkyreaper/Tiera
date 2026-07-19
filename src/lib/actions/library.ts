"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  markRecommendationClicked,
  markRecommendationOpened,
  type RecommendationSource,
} from "@/lib/db/recommendation-outcomes";

export async function addRecommendationToLibrary(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bookId = formData.get("bookId") as string;
  const path = formData.get("path") as string;
  const source = formData.get("source") as RecommendationSource | null;

  if (!bookId) return;

  // want_to_read: true — a recommendation's candidates already exclude
  // anything in the viewer's library (see getRankedRecommendationCandidates/
  // getRecommendations), so this upsert is always a fresh insert here, never
  // a no-op on an existing row; clicking "Add" from a recommendation *is*
  // "I want to read this," so it lands straight in the new TBR shelf rather
  // than needing a separate action.
  await supabase.from("user_books").upsert(
    { user_id: user.id, book_id: bookId, want_to_read: true },
    { onConflict: "user_id,book_id", ignoreDuplicates: true },
  );

  if (source) {
    await markRecommendationClicked(supabase, user.id, bookId, source);
  }

  if (path) {
    revalidatePath(path);
  }
}

// Called directly from BookDetailDrawer's client-side onOpenChange (bound
// with bookId/source via .bind(), same pattern as other server actions
// invoked programmatically rather than via a form) — not a form submission,
// so there's no FormData to read from.
export async function logRecommendationOpened(
  bookId: string,
  source: RecommendationSource,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await markRecommendationOpened(supabase, user.id, bookId, source);
}
