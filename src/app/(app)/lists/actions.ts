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

// Same cooldown as migration 0025's trigger, and for the same reason: this
// is a direct tier_lists column write, not a tier_list_items change, so the
// trigger's own cooldown never applies here — without this, scripting
// repeated calls to updateListDetails (or even just saveAndGoToSearch, which
// also runs through here on every navigation) would bypass it entirely and
// still be able to keep a list pinned at the top of Explore's Recent sort.
const UPDATED_AT_COOLDOWN_MS = 15 * 60 * 1000;

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

  const { data: currentList } = await supabase
    .from("tier_lists")
    .select("updated_at")
    .eq("id", tierListId)
    .maybeSingle();
  const offCooldown =
    !currentList?.updated_at ||
    Date.now() - new Date(currentList.updated_at).getTime() >
      UPDATED_AT_COOLDOWN_MS;

  await supabase
    .from("tier_lists")
    .update({
      title,
      description,
      tags,
      is_public: isPublic,
      ...(offCooldown ? { updated_at: new Date().toISOString() } : {}),
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
    supabase.from("user_books").upsert(
      bookIds.map((bookId) => ({ user_id: userId, book_id: bookId })),
      { onConflict: "user_id,book_id", ignoreDuplicates: true },
    ),
    supabase.from("books").update({ is_draft: false }).in("id", bookIds),
  ]);
}

export async function updateListDetails(formData: FormData) {
  const tierListId = await saveListFields(formData, true);
  revalidatePath(`/lists/${tierListId}`);
  // Title/description/visibility changes should show up on Explore right
  // away too, not just the list's own page — same staleness class as the
  // tier_list_items mutations below.
  revalidatePath("/explore");
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

export async function saveAndGoToAiImport(formData: FormData) {
  const tierListId = await saveListFields(formData, false);
  redirect(`/lists/${tierListId}/import/ai`);
}

// Called directly from the client (not a form submission) when Publish is
// clicked on the create flow's first step — persists the current fields,
// same as the "save unsaved state before navigating" actions above, but
// deliberately doesn't redirect: the caller just flips to the review step
// locally afterward, staying on the same page.
export async function savePublishStep(formData: FormData) {
  await saveListFields(formData, false);
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

// The manage view's "Save" button (replaces the old separate Edit/Delete
// pair there). Board changes (drag-and-drop) are already persisted live by
// moveBookToTier/addBookToTier/reorderTierItems as they happen — there's
// no unsaved title/visibility state in this view to actually commit here,
// unlike the create flow. This just revalidates Profile (its list-card
// preview would otherwise be served stale from the router cache, same
// root cause as the cancelListEdit fix above) and sends them back there.
export async function finishManagingList() {
  revalidatePath("/profile");
  redirect("/profile");
}

// Shared by cancelListEdit and discardUnsavedDraft below — discards a still-
// unsaved draft entirely (any books already added cascade-delete with it)
// instead of leaving an orphaned row that never shows up anywhere. If it's
// not a draft (an already-saved list being edited), the delete matches
// nothing and this is a no-op. Returns whether it actually deleted anything.
async function discardDraftList(
  supabase: SupabaseServerClient,
  userId: string,
  tierListId: string,
): Promise<boolean> {
  const { data: items } = await supabase
    .from("tier_list_items")
    .select("book_id")
    .eq("tier_list_id", tierListId);
  const bookIds = [...new Set((items ?? []).map((item) => item.book_id))];

  const { data: deleted } = await supabase
    .from("tier_lists")
    .delete()
    .eq("id", tierListId)
    .eq("user_id", userId)
    .eq("is_draft", true)
    .select("id");

  if (!deleted || deleted.length === 0) {
    return false;
  }

  await deleteOrphanedDraftBooks(supabase, bookIds);
  // Without this, /profile's router cache can still serve the version
  // from before this delete — the canceled draft appearing there
  // afterward was exactly that stale-cache symptom, not the delete
  // itself failing (saveAsDraft already does this for the same reason).
  revalidatePath("/profile");
  return true;
}

export async function cancelListEdit(tierListId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const discarded = await discardDraftList(supabase, user.id, tierListId);
  redirect(discarded ? "/profile" : `/lists/${tierListId}`);
}

// The create/edit flow only ever runs against a still-unsaved draft (see
// lists/[id]/page.tsx's own comment) — Cancel and Publish -> Save Draft/Share
// are the two explicit ways to keep or discard it. Tapping away to another
// bottom-nav tab is neither of those, so NavBar calls this to treat it the
// same as Cancel rather than leaving the draft dangling — the user's own
// call: "users can go to the Publish tab to save their draft if they want."
// Doesn't redirect itself; NavBar navigates once this resolves.
export async function discardUnsavedDraft(tierListId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await discardDraftList(supabase, user.id, tierListId);
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
      const [{ count: itemCount }, { count: libraryCount }] = await Promise.all(
        [
          supabase
            .from("tier_list_items")
            .select("id", { count: "exact", head: true })
            .eq("book_id", bookId),
          supabase
            .from("user_books")
            .select("id", { count: "exact", head: true })
            .eq("book_id", bookId),
        ],
      );

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
  revalidateFeeds();
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
  revalidateFeeds();
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
  revalidateFeeds();
}

// Ranking a book (or moving it between tiers) changes the score
// computeMatch uses, which every Compare page depends on, and also bumps
// tier_lists.updated_at (via the tier_list_items trigger, migration 0024),
// which Explore's Recent sort depends on — none of those are the
// revalidatePath(`/lists/${id}`) route above already covers. Compare/
// [username] is a dynamic route, so revalidating it needs the 'page' type
// to cover every username, not just one specific instance.
function revalidateFeeds() {
  revalidatePath("/compare");
  revalidatePath("/compare/[username]", "page");
  revalidatePath("/explore");
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
  // Reordering doesn't change computeMatch's score (Compare doesn't care),
  // but it does change both the book order Explore's card preview shows
  // within a tier and (via the same trigger) updated_at — so Explore still
  // needs to be revalidated here, just not the full revalidateFeeds().
  revalidatePath("/explore");
}
