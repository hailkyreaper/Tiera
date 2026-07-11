-- Cleans up a second wave of duplicate `books` rows, this time caused by the
-- Goodreads CSV import: Goodreads' Title column bakes the series info into
-- the title itself (e.g. "Golden Son (Red Rising Saga, #2)"), which never
-- exact-matched the plain "Golden Son" already in the catalog from a search/
-- add elsewhere, so every already-owned book in a real import created a
-- fresh duplicate instead of being matched. Root cause fixed in
-- `src/lib/goodreads-csv.ts` (`stripSeriesSuffix`, applied to every future
-- import); this migration is the one-time cleanup for rows already created
-- by the bug, mirroring migration 0020's approach exactly (single statement,
-- chained writable CTEs — see that migration's header for why: whatever
-- runs this SQL isolates each semicolon-separated statement, so a helper
-- table shared across separate statements doesn't work here).
--
-- Matching is asymmetric (unlike 0020): a "csv" book is one created by the
-- Goodreads import (`google_volume_id` starting `isbn:` or `goodreads:`)
-- whose title, with exactly one trailing "(...)" group stripped, matches the
-- title + first author of some other, non-CSV-sourced book — that other row
-- is treated as canonical. A CSV-imported book with no such match (a
-- genuinely new book, or one without a series suffix to begin with) is left
-- alone entirely.
with csv_books as (
  select
    id,
    regexp_replace(trim(title), '\s*\([^()]*\)\s*$', '') as stripped_title,
    lower(trim(authors[1])) as norm_author
  from books
  where (google_volume_id like 'isbn:%' or google_volume_id like 'goodreads:%')
    and authors is not null and array_length(authors, 1) > 0
),
canonical_candidates as (
  select
    id as canonical_id,
    lower(trim(title)) as norm_title,
    lower(trim(authors[1])) as norm_author,
    row_number() over (
      partition by lower(trim(title)), lower(trim(authors[1]))
      order by
        (description is not null) desc,
        (thumbnail_url is not null) desc,
        created_at asc
    ) as rn
  from books
  where google_volume_id not like 'isbn:%'
    and google_volume_id not like 'goodreads:%'
    and authors is not null and array_length(authors, 1) > 0
),
dupe_map as (
  select c.id as duplicate_id, cc.canonical_id
  from csv_books c
  join canonical_candidates cc
    on lower(c.stripped_title) = cc.norm_title
   and c.norm_author = cc.norm_author
  where cc.rn = 1
),
ub_delete as (
  delete from user_books ub
  using dupe_map m
  where ub.book_id = m.duplicate_id
    and exists (
      select 1 from user_books ub2
      where ub2.user_id = ub.user_id and ub2.book_id = m.canonical_id
    )
  returning ub.id
),
ub_update as (
  update user_books ub
  set book_id = m.canonical_id
  from dupe_map m
  where ub.book_id = m.duplicate_id
    and not exists (
      select 1 from user_books ub2
      where ub2.user_id = ub.user_id and ub2.book_id = m.canonical_id
    )
  returning ub.id
),
ti_delete as (
  delete from tier_list_items ti
  using dupe_map m
  where ti.book_id = m.duplicate_id
    and exists (
      select 1 from tier_list_items ti2
      where ti2.tier_list_id = ti.tier_list_id and ti2.book_id = m.canonical_id
    )
  returning ti.id
),
ti_update as (
  update tier_list_items ti
  set book_id = m.canonical_id
  from dupe_map m
  where ti.book_id = m.duplicate_id
    and not exists (
      select 1 from tier_list_items ti2
      where ti2.tier_list_id = ti.tier_list_id and ti2.book_id = m.canonical_id
    )
  returning ti.id
)
delete from books
where id in (select duplicate_id from dupe_map);
