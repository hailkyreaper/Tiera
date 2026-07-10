/**
 * Google's Books content API bakes a page-curl graphic into the image itself
 * whenever the `edge` query param is present (e.g. `edge=curl`) — strip it so
 * covers render flat. Open Library covers never have this param, so this is a
 * no-op for them.
 */
export function cleanCoverUrl<T extends string | null | undefined>(
  url: T,
): T {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("edge");
    return parsed.toString() as T;
  } catch {
    return url;
  }
}
