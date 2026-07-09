-- Fixes a real bug from migration 0014: `add column is_draft ... default true`
-- applied that default to every EXISTING list too, not just new ones — so
-- every list created before today suddenly looked like an unsaved draft and
-- got filtered out of the profile page. Every list that already existed
-- predates the draft concept entirely, so it was always "saved" in every
-- sense that matters — backfill them accordingly.
update tier_lists set is_draft = false where is_draft = true;
