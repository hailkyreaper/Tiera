// Runs `fn` over `items` with at most `limit` in flight at once — used by
// every bulk import path (Goodreads CSV, AI photo) that can process dozens
// of rows each needing a slow external call (Open Library, book search).
// Fully sequential risks a serverless timeout on a large batch; fully
// unbounded-parallel would hammer a third-party API we don't control the
// rate limits of. A small fixed pool is the middle ground.
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}
