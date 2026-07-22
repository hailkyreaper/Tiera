-- Sprint 9 Final QA: form validation audit found tier_lists.title has no
-- server-side length limit at all — only the client's <input maxLength={40}>
-- enforces it, which a raw request bypassing the browser can ignore entirely
-- (confirmed live: a 500-char title was accepted and stored as-is). Every
-- other user-text column already has a matching DB-level check
-- (list_comments.body, profiles.bio/location/display_name — see their own
-- migrations), title was just missed. Constrains it to the client's own
-- existing 40-char limit, so the two can't drift apart.
--
-- NOT VALID: skips checking pre-existing rows (there's no way to inspect
-- every user's data directly from here to confirm none exceed 40 chars
-- already, e.g. from seeded test accounts) — still enforced on every new
-- insert/update from this point on, which is what actually matters.
alter table tier_lists
  add constraint tier_lists_title_length check (char_length(title) <= 40) not valid;
