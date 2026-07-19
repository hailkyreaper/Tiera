import type { GoogleBookVolume } from "@/lib/google-books";

type OpenLibrarySearchResponse = {
  docs?: { key?: string; subject?: string[]; cover_i?: number }[];
};

type OpenLibraryWorkResponse = {
  description?: string | { type?: string; value?: string };
  subjects?: string[];
  covers?: number[];
};

type OpenLibraryEditionResponse = {
  covers?: number[];
};

// A direct ISBN key lookup on the edition record itself — unambiguous,
// unlike either guessing a cover.openlibrary.org URL from the ISBN
// (confirmed live: the same ISBN flips between 200 and 404 under
// `?default=false` from one check to the next) or a free-text title+author
// search (confirmed live: relevance ranking can surface an unrelated
// omnibus/study-guide edition with no cover ahead of the real one). This
// endpoint either has the exact edition on file with its own indexed
// cover ids, or it doesn't — no ranking involved.
export async function fetchCoverUrlByIsbn(
  isbn: string,
): Promise<string | null> {
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data: OpenLibraryEditionResponse = await res.json();
    const coverId = data.covers?.[0];
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
  } catch {
    return null;
  }
}

type OpenLibraryEditionsResponse = {
  entries?: { languages?: { key: string }[]; covers?: number[] }[];
};

// A work-level search result's `cover_i` is whichever edition Open
// Library happened to associate with the work as a whole — not
// necessarily an English one. Confirmed live: searching "Red Rising"
// (work /works/OL17076473W, itself tagged eng/por/fre — no Spanish at
// all) still returned the Spanish "Amanecer Rojo" cover as cover_i, even
// though the work's own editions list has several real English covers
// available. This checks that list directly and prefers the first
// edition actually tagged English with a real cover, instead of trusting
// the work-level guess.
export async function fetchEnglishEditionCoverUrl(
  workKey: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org${workKey}/editions.json?limit=20`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;

    const data: OpenLibraryEditionsResponse = await res.json();
    const englishEdition = (data.entries ?? []).find(
      (edition) =>
        edition.languages?.some((lang) => lang.key === "/languages/eng") &&
        (edition.covers?.length ?? 0) > 0,
    );
    const coverId = englishEdition?.covers?.[0];
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
  } catch {
    return null;
  }
}

// Open Library's search.json never includes a synopsis — that only lives on
// the separate per-work endpoint, keyed by the "key" (e.g. "/works/OL123W")
// a search result already gives us.
async function fetchOpenLibraryDescription(
  workKey: string,
): Promise<string | null> {
  try {
    const res = await fetch(`https://openlibrary.org${workKey}.json`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const data: OpenLibraryWorkResponse = await res.json();
    if (!data.description) return null;

    return typeof data.description === "string"
      ? data.description
      : (data.description.value ?? null);
  } catch {
    return null;
  }
}

type OpenLibraryDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  ratings_average?: number;
  ratings_count?: number;
  number_of_pages_median?: number;
};

type OpenLibrarySearchResultsResponse = {
  docs?: OpenLibraryDoc[];
};

function openLibraryDocToVolume(doc: OpenLibraryDoc): GoogleBookVolume {
  return {
    id: doc.key,
    volumeInfo: {
      title: doc.title,
      authors: doc.author_name,
      publishedDate: doc.first_publish_year?.toString(),
      pageCount: doc.number_of_pages_median,
      averageRating: doc.ratings_average,
      ratingsCount: doc.ratings_count,
      imageLinks: doc.cover_i
        ? { thumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` }
        : undefined,
    },
  };
}

// Open Library's own relevance ordering already weights title matches
// properly (unlike a plain Google Books query, which needed a separate
// intitle: pass to avoid surfacing full-text matches from obscure scanned
// documents), its API has been reliably available in testing where
// Google's intermittently 503s, and it returns real ratings data far more
// consistently — so this is the primary book search source now.
export async function searchOpenLibraryBooks(
  query: string,
  limit = 20,
): Promise<GoogleBookVolume[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    fields:
      "key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,number_of_pages_median",
  });

  const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(
      `searchOpenLibraryBooks failed: ${res.status} ${res.statusText}`,
    );
    return [];
  }

  const data: OpenLibrarySearchResultsResponse = await res.json();
  return (data.docs ?? []).map(openLibraryDocToVolume);
}

function dedupeKey(book: GoogleBookVolume): string {
  return `${book.volumeInfo.title?.trim().toLowerCase() ?? ""}|${book.volumeInfo.authors?.[0]?.trim().toLowerCase() ?? ""}`;
}

// A cheap proxy (ratings/cover/page-count) turned out to be actively
// unreliable here: confirmed live, Open Library's sparse "Gone Girl" stub
// (created 2022, never touched since except a metadata bump, genuinely no
// description field on the work record at all) still carries its own
// ratings_average in the *search* doc, so it looked richer than the real,
// fully-populated record by that heuristic alone. Only an actual
// description check is trustworthy — but that means a real per-candidate
// fetch, so this only runs it for genuine title+author collisions (rare),
// never on every result.
function isRicherFallback(a: GoogleBookVolume, b: GoogleBookVolume): boolean {
  const aRatings = a.volumeInfo.ratingsCount ?? 0;
  const bRatings = b.volumeInfo.ratingsCount ?? 0;
  if (aRatings !== bRatings) return aRatings > bRatings;

  const aCover = Boolean(a.volumeInfo.imageLinks?.thumbnail);
  const bCover = Boolean(b.volumeInfo.imageLinks?.thumbnail);
  if (aCover !== bCover) return aCover;

  return (a.volumeInfo.pageCount ?? 0) > (b.volumeInfo.pageCount ?? 0);
}

// Open Library carries multiple duplicate "work" records for many popular
// books — confirmed live: a "Gone Girl" search returns both the real,
// fully-populated record and a bare stub with no description at all.
// Deduping by normalized title+author before results ever reach the UI
// means a user can't accidentally pick the thin duplicate in the first
// place, rather than trying to detect/backfill it after the fact. Local
// results already carry their real (possibly null) description directly —
// no fetch needed to check those. A live Open Library result never carries
// description in its lightweight search-doc form at all, so any live
// candidate in a genuine duplicate group needs a real per-work fetch to
// know whether IT has one — bounded to just that group, not every result.
export async function dedupeByTitleAuthor(
  books: GoogleBookVolume[],
): Promise<GoogleBookVolume[]> {
  const groups = new Map<string, GoogleBookVolume[]>();
  for (const book of books) {
    const key = dedupeKey(book);
    const group = groups.get(key);
    if (group) group.push(book);
    else groups.set(key, [book]);
  }

  const deduped = await Promise.all(
    [...groups.values()].map(async (group) => {
      if (group.length === 1) return group[0];

      const withRealDescription = await Promise.all(
        group.map(async (book) => {
          if (book.volumeInfo.description) return true;
          const workKey = extractOpenLibraryWorkKey(book.id);
          if (!workKey) return false;
          const data = await fetchOpenLibraryDataByWorkKey(workKey);
          return data.description !== null;
        }),
      );

      const firstWithDescription = group.find(
        (_, i) => withRealDescription[i],
      );
      if (firstWithDescription) return firstWithDescription;

      // None of them have one — fall back to whichever looks most
      // established, rather than an arbitrary pick.
      return group.reduce((best, candidate) =>
        isRicherFallback(candidate, best) ? candidate : best,
      );
    }),
  );

  return deduped;
}

// Untagged subjects ending in one of these words tend to be genuine
// genre/subgenre labels (e.g. "Space Fleet Science Fiction", bare
// "Fantasy"), as opposed to thematic/topical or classification subjects
// (e.g. "Refugees", "English Literature") that aren't genre information.
const GENRE_SUFFIXES = new Set([
  "fiction",
  "fantasy",
  "romance",
  "thriller",
  "mystery",
  "horror",
  "adventure",
  "action",
  "saga",
  "opera",
  "dystopia",
  "utopia",
  "drama",
  "comedy",
  "noir",
  "western",
  "gothic",
]);

function toTitleCase(value: string): string {
  return value.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}

/** Splits a raw BISAC-style path ("Fiction / Fantasy / Dark Fantasy" or
 * "Fiction, Fantasy, Dark Fantasy") into its individual segments. */
function splitPath(raw: string): string[] {
  return raw
    .split(/[/,]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function looksLikeGenre(subject: string): boolean {
  const trimmed = subject.trim();
  if (trimmed.toLowerCase() === "fiction") return false;
  const words = trimmed.split(/\s+/);
  const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, "");
  return GENRE_SUFFIXES.has(lastWord);
}

export type OpenLibraryData = {
  genres: string[];
  coverUrl: string | null;
  description: string | null;
  publishedDate: string | null;
};

async function fetchSearchDoc(query: string): Promise<
  | {
      key?: string;
      subject?: string[];
      cover_i?: number;
      first_publish_year?: number;
    }
  | undefined
> {
  const params = new URLSearchParams({
    q: query,
    fields: "key,subject,cover_i,first_publish_year",
    limit: "1",
  });

  const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return undefined;

  const data: OpenLibrarySearchResponse = await res.json();
  return data.docs?.[0];
}

export async function getOpenLibraryData(
  title: string,
  author?: string,
  options?: { includeDescription?: boolean },
): Promise<OpenLibraryData> {
  // Combining title + author into one free-text query can return zero
  // results even when both individually would find the book — confirmed
  // live with "The Sword of Kaigen M.L. Wang" (0 results combined) vs.
  // "The Sword of Kaigen" alone (finds it immediately, real cover
  // included). Open Library's relevance ranking seems to choke on some
  // author-name formats (e.g. unspaced initials) when they're mixed into
  // the same query as the title, so a title-only retry recovers cases the
  // combined query misses instead of just accepting an empty result.
  const doc =
    (author ? await fetchSearchDoc(`${title} ${author}`) : undefined) ??
    (await fetchSearchDoc(title));
  const genres = subjectsToGenres(doc?.subject ?? []);

  const coverUrl = doc?.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    : null;

  const description =
    options?.includeDescription && doc?.key
      ? await fetchOpenLibraryDescription(doc.key)
      : null;

  const publishedDate = doc?.first_publish_year?.toString() ?? null;

  return { genres, coverUrl, description, publishedDate };
}

// Shared by getOpenLibraryData (search-result subjects) and
// fetchOpenLibraryDataByWorkKey (a work record's own subjects — same
// shape, just a different source doc).
function subjectsToGenres(subjects: string[]): string[] {
  // genre:-tagged subjects are Open Library's own explicit genre
  // labeling — trusted as-is (aside from dropping a bare "Fiction").
  const taggedSegments = subjects
    .filter((subject) => subject.toLowerCase().startsWith("genre:"))
    .flatMap((subject) => splitPath(subject.slice("genre:".length)))
    .filter((segment) => segment.toLowerCase() !== "fiction");

  // Untagged subjects only get kept if they look genre-shaped — this is
  // what filters out thematic noise like "Refugees" or "Biography".
  const untaggedSegments = subjects
    .filter((subject) => !subject.includes(":"))
    .flatMap((subject) => splitPath(subject))
    .filter((segment) => looksLikeGenre(segment));

  return [...new Set([...taggedSegments, ...untaggedSegments].map(toTitleCase))];
}

// Extracts a bare Open Library work id ("OL123456W") out of whatever format
// books.google_volume_id happens to store it in — "/works/OL123456W" (the
// format a live search result's own key already comes in) or "ol:OL123456W"
// (the format some direct-insert paths, e.g. test-data seeding, have used).
// Returns null for anything else (a Google volume id, a synthetic
// "isbn:"/"goodreads:" id) — those have no Open Library work to look up.
export function extractOpenLibraryWorkKey(googleVolumeId: string): string | null {
  const match = googleVolumeId.match(/OL\d+W\b/);
  return match ? `/works/${match[0]}` : null;
}

// Looks a book up by its *already-known* Open Library work key instead of
// re-searching by title+author — strictly more reliable (an exact record
// lookup, no relevance ranking to get wrong) and the only way to recover
// books whose title+author search doesn't reliably surface the right work
// (confirmed live: short/common titles like "It", "Circe", and "Piranesi"
// — all already-known via a stored work key from an earlier import — never
// got a description from runBackfill's search-based lookup, despite Open
// Library clearly having real description text for all three once fetched
// directly by key). Single request covers genres + description + cover,
// where the search-based path needed two (search, then a second fetch for
// description only).
export async function fetchOpenLibraryDataByWorkKey(
  workKey: string,
): Promise<OpenLibraryData> {
  try {
    const res = await fetch(`https://openlibrary.org${workKey}.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return { genres: [], coverUrl: null, description: null, publishedDate: null };
    }

    const data: OpenLibraryWorkResponse = await res.json();
    const genres = subjectsToGenres(data.subjects ?? []);
    const coverUrl = data.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
      : null;
    const description = !data.description
      ? null
      : typeof data.description === "string"
        ? data.description
        : (data.description.value ?? null);

    return { genres, coverUrl, description, publishedDate: null };
  } catch {
    return { genres: [], coverUrl: null, description: null, publishedDate: null };
  }
}
