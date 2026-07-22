/** Structural, not imported from a specific Supabase package version — every
 * Postgrest/Supabase query result's `error` shape has at least `message`. */
type SupabaseErrorLike = { message: string; code?: string } | null;

/**
 * Unwraps a Supabase query result, throwing a real Error when the query
 * itself failed (network blip, RLS denial, DB error) instead of letting a
 * `null`/`undefined` `data` silently fall through and render as "no data"
 * — the failure mode this whole app had everywhere before this helper
 * existed (see CLAUDE.md's Sprint 9 checklist). A legitimate "no rows"
 * result (`data: null, error: null`, e.g. `.maybeSingle()` finding
 * nothing) is untouched — this only throws when `error` is actually set,
 * so existing `if (!row) notFound()`-style checks keep working exactly as
 * before.
 *
 * Thrown errors are caught by the nearest error.tsx boundary (root or
 * `(app)/error.tsx`) during a Server Component render, or by whatever
 * try/catch wraps a server action call.
 */
export function assertNoSupabaseError<T>(
  result: { data: T; error: SupabaseErrorLike },
  context: string,
): T {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Softer counterpart to `assertNoSupabaseError`, for supplementary/decorative
 * queries where a failure shouldn't take down the whole page — trending-
 * searches and discovery rails, impression logging, notification counts.
 * Logs server-side (so the failure is at least visible, unlike before) and
 * returns `fallback` instead of throwing. Reach for `assertNoSupabaseError`
 * by default; only use this where the caller already treats the data as
 * optional/best-effort.
 */
export function logSupabaseError<T>(
  result: { data: T; error: SupabaseErrorLike },
  context: string,
  fallback: T,
): T {
  if (result.error) {
    console.error(`${context}: ${result.error.message}`);
    return fallback;
  }
  return result.data;
}
