import Papa from "papaparse";
import type { Tier } from "@/lib/tiers";

export type GoodreadsRow = {
  title: string;
  author: string | null;
  /** ISBN13-preferred — used for the synthetic dedup id (`isbn:{isbn}`). */
  isbn: string | null;
  myRating: number | null;
  averageRating: number | null;
  /** Goodreads has no single built-in did-not-finish concept — people land
   * on one of two conventions: a self-made "dnf" shelf tag, or (more
   * common in practice, confirmed against a real export) using
   * "did-not-finish" as the Exclusive Shelf itself. Checked against both
   * Exclusive Shelf and Bookshelves for either spelling, since either can
   * appear in either column depending on how the user shelved it. */
  dnf: boolean;
};

// Goodreads wraps ISBN/ISBN13 in ="..." (an Excel-formula escape) so the
// leading zeros survive being opened in a spreadsheet — strip that back off.
function cleanIsbn(raw: string | undefined): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/^="?/, "").replace(/"$/, "").trim();
  return stripped || null;
}

function toNumberOrNull(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Goodreads' Title column bakes the series info into the title itself, e.g.
// "Golden Son (Red Rising Saga, #2)" — every other source in this app (Open
// Library, Google Books, and the catalog rows already created from them)
// uses the plain title, so left as-is this never title-matches an existing
// "Golden Son" row and creates a duplicate on every import instead of
// reusing it. Strips exactly one trailing "(...)" group.
function stripSeriesSuffix(title: string): string {
  return title.replace(/\s*\([^()]*\)\s*$/, "").trim();
}

// Matches either DNF convention, in either column: a self-made "dnf" shelf
// tag, or "did-not-finish" used directly as the Exclusive Shelf (confirmed
// against a real export — Goodreads' own UI offers this as a one-click
// shelf name, so it's at least as common as a custom "dnf" tag).
function isDnf(shelf: string, bookshelves: string): boolean {
  const haystack = `${shelf} ${bookshelves}`.toLowerCase();
  return haystack.includes("dnf") || haystack.includes("did-not-finish");
}

export function parseGoodreadsCsv(csvText: string): GoodreadsRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return data
    // Only books actually finished, plus anything explicitly marked DNF —
    // skip plain "to-read"/"currently-reading", since a rating/tier doesn't
    // mean much for a book you haven't read (or given up on) yet.
    .filter((row) => {
      const shelf = (row["Exclusive Shelf"] ?? "").trim();
      const bookshelves = row["Bookshelves"] ?? "";
      return shelf === "read" || isDnf(shelf, bookshelves);
    })
    .map((row) => {
      const shelf = (row["Exclusive Shelf"] ?? "").trim();
      const bookshelves = row["Bookshelves"] ?? "";
      return {
        title: stripSeriesSuffix((row["Title"] ?? "").trim()),
        author: (row["Author"] ?? "").trim() || null,
        // ISBN13 first — ISBN (10-digit) is sometimes blank for newer books.
        isbn: cleanIsbn(row["ISBN13"]) ?? cleanIsbn(row["ISBN"]),
        myRating: toNumberOrNull(row["My Rating"]),
        averageRating: toNumberOrNull(row["Average Rating"]),
        dnf: isDnf(shelf, bookshelves),
      };
    })
    .filter((row) => row.title.length > 0);
}

// 5 stars -> S, down to 1 star -> D. Unrated books (My Rating blank/0) have
// nowhere principled to land on this scale, so callers should route those to
// "unranked" rather than calling this with a null rating.
const RATING_TO_TIER: Record<number, Exclude<Tier, "unranked">> = {
  5: "S",
  4: "A",
  3: "B",
  2: "C",
  1: "D",
};

export function tierForRating(rating: number | null, dnf: boolean): Tier {
  // DNF always bottoms out at F regardless of any star rating attached —
  // didn't finish it outranks whatever partial rating it has.
  if (dnf) return "F";
  if (rating === null) return "unranked";
  return RATING_TO_TIER[Math.round(rating)] ?? "unranked";
}
