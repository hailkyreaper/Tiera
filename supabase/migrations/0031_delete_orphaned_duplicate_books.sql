-- Orphaned duplicate catalog rows found while investigating the "Gone
-- Girl missing description" report — Open Library carries multiple work
-- records for the same real book, and findOrCreateBook only ever matched
-- on exact google_volume_id (no title+author fallback), so a book already
-- in the catalog under a Google-sourced or one Open-Library-work id could
-- get re-added under a different id (via this session's own test-account
-- seeding scripts, or ad-hoc testing) instead of reusing the existing row.
--
-- Verified directly before writing this: for every id below, both
-- user_books and tier_list_items have zero rows referencing it — these
-- are pure dead weight, not a real user's actual ranking. The *other*
-- duplicate in each pair (not listed here) is the one people have actually
-- ranked/added and is left untouched. Same reasoning and shape as the
-- 0020/0021/0023 cleanup migrations before this one.
delete from books where id in (
  'd0a13704-aa53-4534-a389-9461d49d0f6b', -- Hyperion (orphaned dup)
  '200d30b8-0f9a-4ca1-81db-2c83c0fc48f1', -- Morning Star (orphaned dup)
  '004c14fb-2aa5-46c4-80d9-5000e1ac89db', -- Gone Girl (orphaned dup)
  '89c795c5-4056-4dc7-a679-f27c5674b74f', -- Dark Age (orphaned dup)
  'f19c5430-8392-4bbd-8591-f271775ddfc2', -- Golden Son (orphaned dup)
  'd54f82fa-f903-4c8d-a08a-e42de1bb1510', -- Iron Gold (orphaned dup)
  '1e10ac47-c70b-45bb-90e2-7fa25eefbe19'  -- Red Rising (orphaned dup)
);
