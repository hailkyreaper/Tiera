export type GoogleBookVolume = {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    averageRating?: number;
    ratingsCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

type GoogleBooksResponse = {
  items?: GoogleBookVolume[];
};

const FETCH_POOL_SIZE = 40;

async function fetchGoogleBooksPage(query: string): Promise<GoogleBookVolume[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(FETCH_POOL_SIZE),
    printType: "books",
  });
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }
  const url = `https://www.googleapis.com/books/v1/volumes?${params}`;

  // Google's API intermittently returns 503 "backendFailed" on an otherwise
  // valid request — retrying once or twice clears it almost every time, so
  // don't let a single flaky response make search silently return nothing.
  let res: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) break;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 300));
  }

  if (!res || !res.ok) {
    console.error(
      `searchGoogleBooks failed after retries: ${res?.status} ${res?.statusText}`,
    );
    return [];
  }

  const data: GoogleBooksResponse = await res.json();
  return data.items ?? [];
}

function byPopularity(a: GoogleBookVolume, b: GoogleBookVolume): number {
  return (b.volumeInfo.ratingsCount ?? 0) - (a.volumeInfo.ratingsCount ?? 0);
}

export async function searchGoogleBooks(
  query: string,
  limit = 20,
): Promise<GoogleBookVolume[]> {
  // A plain query matches loosely against description/full-text too, so a
  // short/generic query (e.g. "rage of") can surface obscure full-text
  // matches — old scanned journals, government records — ahead of the
  // actual well-known title, since most results tie at 0 ratingsCount and
  // there's nothing left to sort by. Running a second, title-restricted
  // query in parallel (Google's intitle: operator, repeated per word — a
  // single intitle:"multi word" clause returns nothing) and ranking those
  // matches first fixes that. The plain query stays as a fallback merged in
  // after, so author-only searches (which rarely match on title) still work.
  const words = query.trim().split(/\s+/).filter(Boolean);
  const titleQuery = words.map((word) => `intitle:${word}`).join(" ");

  const [titleResults, plainResults] = await Promise.all([
    fetchGoogleBooksPage(titleQuery),
    fetchGoogleBooksPage(query),
  ]);

  const seen = new Set<string>();
  const merged: GoogleBookVolume[] = [];
  for (const book of [
    ...titleResults.slice().sort(byPopularity),
    ...plainResults.slice().sort(byPopularity),
  ]) {
    if (!seen.has(book.id)) {
      seen.add(book.id);
      merged.push(book);
    }
  }

  return merged.slice(0, limit);
}

export function secureThumbnail(url: string | undefined): string | undefined {
  return url?.replace("http://", "https://");
}

// Single source of truth for "book -> form fields" so the search grid's
// hidden inputs and the live-dropdown's programmatic FormData stay in sync.
export function bookFormFields(book: GoogleBookVolume): Record<string, string> {
  return {
    googleVolumeId: book.id,
    title: book.volumeInfo.title,
    authors: book.volumeInfo.authors?.join(", ") ?? "",
    description: book.volumeInfo.description ?? "",
    thumbnailUrl: secureThumbnail(book.volumeInfo.imageLinks?.thumbnail) ?? "",
    publishedDate: book.volumeInfo.publishedDate ?? "",
    pageCount: book.volumeInfo.pageCount?.toString() ?? "",
    averageRating: book.volumeInfo.averageRating?.toString() ?? "",
    categories: book.volumeInfo.categories?.join("|") ?? "",
  };
}

export function normalizeCategory(raw: string): string {
  const segments = raw
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length >= 2) return segments[1];
  return segments[0] ?? raw;
}
