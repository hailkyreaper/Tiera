-- One-time cleanup of test/debug data left behind while diagnosing and
-- fixing the Goodreads import bugs (series-suffix duplication, DNF
-- handling, bad-ISBN cover handling) earlier this sprint — not real books
-- from the user's own library. All 12 rows were created by test CSV
-- imports (confirmed by google_volume_id's isbn:/goodreads: synthetic-id
-- convention, exact-matched below rather than by title, so this can't
-- accidentally catch a real catalog row that happens to share a title).
--
-- books.id cascades to both user_books and tier_list_items (see migrations
-- 0002/0003), so deleting the books rows alone is enough to also remove
-- any leftover library entries and tier-list placements these test imports
-- created — no separate cleanup needed, unlike 0020/0021 which had to
-- repoint references onto a surviving canonical row instead of deleting
-- outright.
delete from books
where google_volume_id in (
  'isbn:9780765326355',   -- "The Way of Kings" (flagged as fake test data in CLAUDE.md)
  'isbn:9781234567897',   -- "Some Unrated Book" (flagged as fake test data in CLAUDE.md)
  'goodreads:5f78d43c-67d0-4884-be58-0790ff3392f7', -- "DNF Test Book"
  'goodreads:ee63883f-ba7e-447d-b2c8-fe8d91449073', -- "Verity" (test import row)
  'isbn:9781488054358',   -- "The Wives" (test import row)
  'isbn:9798874757601',   -- "The Perfect Marriage" (test import row)
  'isbn:9780062662590',   -- "The Poppy War (The Poppy War, #1)" (test import row)
  'isbn:9781803144375',   -- "The Housemaid (The Housemaid, #1)" (test import row)
  'goodreads:0fc962ae-89bd-492f-b52e-608e9b083382', -- "Atomic Habits" (test import row)
  'isbn:9781443456630',   -- "The 5 AM Club" (test import row)
  'goodreads:3d3ce7ad-4958-40be-98a9-1427f6a78a80', -- "The Sword of Kaigen" (test import row)
  'isbn:9999999999999'    -- "Bad ISBN Test Book"
);
