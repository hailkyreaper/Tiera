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

// Google's own "relevance" ordering matches loosely against description/
// full-text too, so a well-known title can end up buried under obscure
// editions, study guides, or tangentially-related books. Pulling a larger
// pool and re-sorting by ratingsCount (a reasonable proxy for "the actual
// well-known book", since obscure editions rarely accumulate ratings) fixes
// that without narrowing what can be searched for (an intitle: restriction
// would break author-only searches, which the search box explicitly supports).
const FETCH_POOL_SIZE = 40;

export async function searchGoogleBooks(
  query: string,
  limit = 20,
): Promise<GoogleBookVolume[]> {
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
  const items = data.items ?? [];

  return items
    .slice()
    .sort(
      (a, b) =>
        (b.volumeInfo.ratingsCount ?? 0) - (a.volumeInfo.ratingsCount ?? 0),
    )
    .slice(0, limit);
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
