import type { GoogleBookVolume } from "@/lib/google-books";

type OpenLibrarySearchResponse = {
  docs?: { subject?: string[]; cover_i?: number }[];
};

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
};

export async function getOpenLibraryData(
  title: string,
  author?: string,
): Promise<OpenLibraryData> {
  const query = author ? `${title} ${author}` : title;
  const params = new URLSearchParams({
    q: query,
    fields: "subject,cover_i",
    limit: "1",
  });

  const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return { genres: [], coverUrl: null };
  }

  const data: OpenLibrarySearchResponse = await res.json();
  const doc = data.docs?.[0];
  const subjects = doc?.subject ?? [];

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

  const genres = [
    ...new Set(
      [...taggedSegments, ...untaggedSegments].map(toTitleCase),
    ),
  ];

  const coverUrl = doc?.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    : null;

  return { genres, coverUrl };
}
