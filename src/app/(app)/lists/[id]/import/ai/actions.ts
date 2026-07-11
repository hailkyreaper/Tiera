"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { identifyBooksInImage } from "@/lib/gemini";
import { searchBooks, findOrCreateBook, type BookFields } from "@/lib/db/books";
import type { GoogleBookVolume } from "@/lib/google-books";
import { fetchEnglishEditionCoverUrl } from "@/lib/open-library";
import { mapWithConcurrency } from "@/lib/concurrency";

const IMPORT_CONCURRENCY = 6;

export type AiCandidate = {
  guessedTitle: string;
  guessedAuthor: string | null;
  matched: GoogleBookVolume;
};

export type IdentifyResult = {
  candidates: AiCandidate[];
  unmatchedCount: number;
  error?: string;
};

function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// searchBooks ranks by rating/relevance, not by how well the result
// actually matches the query — blindly trusting its top hit was matching
// AI-guessed titles to unrelated books (confirmed live: wrong covers,
// foreign-language editions with no real title relation to what the photo
// showed). This requires the result's own title to actually contain (or be
// contained by) the guessed title before accepting it as a match; anything
// that doesn't pass is treated the same as no match at all rather than
// settling for "closest available."
function isTitleMatch(resultTitle: string, guessedTitle: string): boolean {
  const a = normalizeTitle(resultTitle);
  const b = normalizeTitle(guessedTitle);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

// Two-phase, called directly from the client (not a <form action>) since
// the result has to come back for the user to review/deselect before
// anything is actually added — see AiPhotoImportForm.
export async function identifyBooksFromPhoto(
  formData: FormData,
): Promise<IdentifyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    return { candidates: [], unmatchedCount: 0, error: "Choose a photo first." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  let identified;
  try {
    identified = await identifyBooksInImage(base64Data, file.type || "image/jpeg");
  } catch (err) {
    console.error("identifyBooksInImage failed:", err);
    return {
      candidates: [],
      unmatchedCount: 0,
      error: "Couldn't read that photo — try again.",
    };
  }

  if (identified.length === 0) {
    return {
      candidates: [],
      unmatchedCount: 0,
      error: "Couldn't identify any books in that photo.",
    };
  }

  // Every guess still has to be matched against real book search — a
  // vision-model reading of a cover/spine is text only, never real
  // metadata/cover art on its own, and matching also catches a misread
  // close enough to still find the right book. Concurrent (bounded): the
  // cap is 50 books for a full shelf, so doing this one at a time could add
  // up to real, noticeable wait — same reasoning as Goodreads import's
  // concurrency pool.
  const matches = await mapWithConcurrency(
    identified,
    IMPORT_CONCURRENCY,
    async (book) => {
      const query = book.author ? `${book.title} ${book.author}` : book.title;
      const results = await searchBooks(supabase, query, 5);
      const matched = results.find((result) =>
        isTitleMatch(result.volumeInfo.title, book.title),
      );

      // Open Library work-level results can carry a cover from the wrong
      // (non-English) edition even when the title matched correctly —
      // confirmed live on "Red Rising": correct English title, but the
      // work's own cover_i was a Spanish edition's art. Only Open
      // Library-sourced matches use this "/works/..." id shape (a local
      // catalog hit from our own table already has a real, previously
      // resolved cover, and a synthetic isbn:/goodreads: id has none to
      // look up this way regardless).
      if (matched?.id.startsWith("/works/")) {
        const englishCover = await fetchEnglishEditionCoverUrl(matched.id);
        if (englishCover) {
          matched.volumeInfo.imageLinks = { thumbnail: englishCover };
        }
      }

      return { book, matched };
    },
  );

  const candidates: AiCandidate[] = [];
  let unmatchedCount = 0;

  for (const { book, matched } of matches) {
    if (matched) {
      candidates.push({
        guessedTitle: book.title,
        guessedAuthor: book.author,
        matched,
      });
    } else {
      unmatchedCount++;
    }
  }

  return { candidates, unmatchedCount };
}

// Adds whichever candidates the user kept checked on the review step.
// Mirrors Goodreads import's is_draft treatment (findOrCreateBook's
// isDraft option) — a photo can identify several books at once from an
// unverified source, so none of them should land in the user's library or
// the shared catalog's search results until the list itself is saved.
//
// Deliberately does NOT redirect — someone doing this series-by-series or
// shelf-by-shelf needs to take several photos in a row without getting
// bounced back to the list after every single one (same "stay on the page
// so you can add several in a row" convention as Search Books). The client
// resets back to the upload step itself after a successful add; the
// existing TopNav back button is how they leave once they're done.
export async function confirmAiBooks(
  tierListId: string,
  selected: BookFields[],
): Promise<{ added: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Concurrent (bounded) for the same reason as the identify step above —
  // up to 50 selections. Safe even if two selected candidates happen to
  // resolve to the same book (a repeated spine read): findOrCreateBook
  // matches on real, already-known google_volume_ids here (not synthetic
  // ones), and that column's unique constraint means a losing concurrent
  // insert just fails gracefully (null bookId, skipped) rather than
  // creating a duplicate row.
  const results = await mapWithConcurrency(
    selected,
    IMPORT_CONCURRENCY,
    async (fields) => {
      const bookId = await findOrCreateBook(supabase, fields, {
        isDraft: true,
      });
      if (!bookId) return false;

      await supabase
        .from("tier_list_items")
        .upsert(
          { tier_list_id: tierListId, book_id: bookId, tier: "unranked" },
          { onConflict: "tier_list_id,book_id" },
        );
      return true;
    },
  );

  revalidatePath(`/lists/${tierListId}`);
  return { added: results.filter(Boolean).length };
}
