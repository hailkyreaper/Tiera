export type GoogleBookVolume = {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    averageRating?: number;
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

export async function searchGoogleBooks(
  query: string,
): Promise<GoogleBookVolume[]> {
  const params = new URLSearchParams({ q: query, maxResults: "20" });
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params}`,
    { next: { revalidate: 3600 } },
  );

  if (!res.ok) {
    return [];
  }

  const data: GoogleBooksResponse = await res.json();
  return data.items ?? [];
}

export function secureThumbnail(url: string | undefined): string | undefined {
  return url?.replace("http://", "https://");
}

export function normalizeCategory(raw: string): string {
  const segments = raw
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length >= 2) return segments[1];
  return segments[0] ?? raw;
}
