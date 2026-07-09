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

export function byPopularity(a: GoogleBookVolume, b: GoogleBookVolume): number {
  return (b.volumeInfo.ratingsCount ?? 0) - (a.volumeInfo.ratingsCount ?? 0);
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
