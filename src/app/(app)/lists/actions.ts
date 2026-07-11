"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
//
// markSaved controls is_draft specifically: only the actual Save button
// should ever mark a list as no longer a draft. Search Books/Add from
// Library also route through here (so the title isn't lost), but must NOT
// flip is_draft — clicking either of those isn't the user clicking Save,
// and a list should only count as "saved" when they actually did.
async function saveListFields(
  formData: FormData,
  markSaved: boolean,
): Promise<string> {
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
    .update({
      title,
      description,
      tags,
      is_public: isPublic,
      ...(markSaved ? { is_draft: false } : {}),
    })
    .eq("id", tierListId)
    .eq("user_id", user.id);

  // Only the real Save button (markSaved) commits the list's books for
  // real. Goodreads import stages books straight into tier_list_items
  // without ever touching user_books, and marks genuinely new catalog rows
  // is_draft (see migration 0022) — a large import shouldn't land in your
  // library, or the shared catalog's search results, until you decide to
  // keep the list. This is what actually confirms them: backfills every
  // book currently on the list into user_books, and clears is_draft so
  // they become searchable app-wide. A harmless no-op for books added via
  // Search/Add from Library, which already upsert user_books (and were
  // never is_draft) at add-time.
  if (markSaved) {
    await commitListBooks(supabase, user.id, tierListId);
  }

  return tierListId;
}

async function commitListBooks(
  supabase: SupabaseServerClient,
  userId: string,
  tierListId: string,
) {
  const { data: items } = await supabase
    .from("tier_list_items")
    .select("book_id")
    .eq("tier_list_id", tierListId);

  const bookIds = [...new Set((items ?? []).map((item) => item.book_id))];
  if (bookIds.length === 0) return;

  await Promise.all([
    supabase
      .from("user_books")
      .upsert(
        bookIds.map((bookId) => ({ user_id: userId, book_id: bookId })),
        { onConflict: "user_id,book_id", ignoreDuplicates: true },
      ),
    supabase.from("books").update({ is_draft: false }).in("id", bookIds),
  ]);
}

export async function updateListDetails(formData: FormData) {
  const tierListId = await saveListFields(formData, true);
  revalidatePath(`/lists/${tierListId}`);
  redirect(`/lists/${tierListId}`);
}

export async function saveAndGoToSearch(formData: FormData) {
  const tierListId = await saveListFields(formData, false);
  redirect(`/lists/${tierListId}/search`);
}

export async function saveAndGoToLibrary(formData: FormData) {
  const tierListId = await saveListFields(formData, false);
  redirect(`/lists/${tierListId}/library`);
}

export async function saveAndGoToGoodreadsImport(formData: FormData) {
  const tierListId = await saveListFields(formData, false);
  redirect(`/lists/${tierListId}/import/goodreads`);
}

// The middle ground between Cancel (discards the list entirely) and Save
// (publishes it for real): keeps whatever title/description/tags/
// visibility and books are already on the list, but — same as Search
// Books/Add from Library above — does NOT flip is_draft, so it still isn't
// committed to the user's library or the shared catalog's search results.
// Redirects to Profile, where the list now shows up (getUserListCards
// includes the caller's own drafts) so they can pick the draft back up
// later instead of it being orphaned with no way back to it.
export async function saveAsDraft(formData: FormData) {
  await saveListFields(formData, false);
  revalidatePath("/profile");
  redirect("/profile");
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

  const { data: items } = await supabase
    .from("tier_list_items")
    .select("book_id")
    .eq("tier_list_id", tierListId);
  const bookIds = [...new Set((items ?? []).map((item) => item.book_id))];

  const { data: deleted } = await supabase
    .from("tier_lists")
    .delete()
    .eq("id", tierListId)
    .eq("user_id", user.id)
    .eq("is_draft", true)
    .select("id");

  if (deleted && deleted.length > 0) {
    await deleteOrphanedDraftBooks(supabase, bookIds);
    redirect("/profile");
  }

  redirect(`/lists/${tierListId}`);
}

// A canceled draft's tier_list_items are already gone (cascaded away with
// the tier_lists row above) by the time this runs. Any book that Goodreads
// import created fresh for this draft (still is_draft — see migration 0022)
// and that nothing else references anymore was never real to begin with, so
// clean it out of the shared catalog rather than leaving a dead row behind.
// Skips anything still referenced elsewhere (another list, another user's
// library) — the RLS delete policy also independently refuses to touch a
// non-draft row, this check just avoids a pointless delete attempt.
async function deleteOrphanedDraftBooks(
  supabase: SupabaseServerClient,
  bookIds: string[],
) {
  await Promise.all(
    bookIds.map(async (bookId) => {
      const [{ count: itemCount }, { count: libraryCount }] =
        await Promise.all([
          supabase
            .from("tier_list_items")
            .select("id", { count: "exact", head: true })
            .eq("book_id", bookId),
          supabase
            .from("user_books")
            .select("id", { count: "exact", head: true })
            .eq("book_id", bookId),
        ]);

      if ((itemCount ?? 0) === 0 && (libraryCount ?? 0) === 0) {
        await supabase
          .from("books")
          .delete()
          .eq("id", bookId)
          .eq("is_draft", true);
      }
    }),
  );
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

// Drag-to-trash on the Create List page — the old "drag out to remove" was
// deliberately dropped in Sprint 5.5 alongside the library browsing row it
// lived in, but that left no way at all to remove a book from a list once
// added. This restores it as an explicit trash drop zone instead.
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
  revalidateCompare();
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

