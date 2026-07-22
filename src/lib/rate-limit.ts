import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Real rate-limiting for the tier-list mutation actions (moveBookToTier,
// addBookToTier, reorderTierItems, removeBookFromList) — see Ideas Backlog
// in CLAUDE.md. The existing updated_at cooldown (migration 0025) only caps
// how often Explore's Recent sort can refresh from repeated edits; it can't
// tell "a few legitimate edits" from "a script hammering the endpoint," and
// does nothing to protect the DB itself from abuse. This is that protection.
//
// Upstash over a DB-backed counter table: these actions fire on every single
// drag-and-drop interaction, so the check needs to be fast and shouldn't add
// load to the main Postgres DB itself — a dedicated, purpose-built store is
// the standard answer here, not a workaround.
//
// Sliding window, 30 requests per 10 seconds per user, shared across all
// four gated actions (one bucket, not one per action) — generous enough for
// genuine rapid manual reorganizing (each drag fires 1-2 of these calls, so
// this covers roughly 15+ fast consecutive drags every 10 seconds) while
// still throttling a sustained scripted flood almost immediately.
const WINDOW = "10 s";
const LIMIT = 30;

// Lazily constructed: importing this module must not throw in an
// environment where the Upstash env vars aren't set yet (e.g. local dev
// before they're configured) — every caller already treats a missing
// limiter as "rate limiting is off", not a hard crash.
let ratelimit: Ratelimit | null | undefined;

function getRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "Rate limiting disabled: UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set.",
    );
    ratelimit = null;
    return ratelimit;
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(LIMIT, WINDOW),
    prefix: "tiera:tier-list-mutations",
  });
  return ratelimit;
}

export class RateLimitError extends Error {
  constructor() {
    super("Too many changes in a short time — slow down and try again.");
    this.name = "RateLimitError";
  }
}

// Throws RateLimitError when the caller has exceeded the shared mutation
// budget. A no-op (never throws) if Upstash isn't configured — missing
// credentials degrade to "no rate limiting" rather than breaking every
// tier-list edit for every user.
export async function assertNotRateLimited(userId: string): Promise<void> {
  const limiter = getRatelimit();
  if (!limiter) return;

  const { success } = await limiter.limit(userId);
  if (!success) {
    throw new RateLimitError();
  }
}
