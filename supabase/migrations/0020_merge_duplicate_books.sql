-- Merges duplicate `books` rows that represent the same book (matched by
-- normalized title + first author) into one canonical row, repointing
-- `user_books` and `tier_list_items` before deleting the duplicates. See
-- CLAUDE.md's "Data quality: duplicate book catalog rows" To Do entry for
-- the root cause: every edition/printing a user adds gets its own row via
-- findOrCreateBook (keyed by google_volume_id / Open Library work key, which
-- differs per edition, not per title).
--
-- Canonical pick per duplicate group: prefers a row with a description, then
-- one with a thumbnail, then the oldest (first-added) row as the final
-- tiebreaker.
--
-- Note: if the same user had BOTH duplicate books in their library, or both
-- placed in the same tier list, the duplicate's user_books/tier_list_items
-- row is deleted rather than repointed (repointing would otherwise violate
-- the (user_id, book_id) / (tier_list_id, book_id) unique constraints) — the
-- canonical book's own existing library entry/tier placement wins in that
-- case, and the duplicate's placement for that one user/list is lost. Scope
-- checked before writing this migration: 5 duplicate pairs across 86 books,
-- so this affects at most a handful of rows.
--
-- Written as ONE statement (multiple chained writable CTEs) rather than a
-- helper table + several separate statements — two earlier attempts at that
-- (TEMP table, then a real table) both hit "relation ... does not exist" on
-- the second statement, because whatever runs this script apparently
-- executes each semicolon-separated statement in full isolation (its own
-- connection/transaction), so nothing created by an earlier statement was
-- visible to a later one — even a real, committed table. A single statement
-- has no such cross-statement dependency: every CTE below runs against one
-- consistent snapshot taken at the start of this one query. Per Postgres
-- semantics, data-modifying CTEs always run to completion exactly once even
-- if nothing later references their output, and the delete/update pair on
-- each table below use mirror-image EXISTS/NOT EXISTS conditions so they
-- never target the same row — safe to run as sibling CTEs.
with ranked as (
  select
    id,
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
  where authors is not null and array_length(authors, 1) > 0
),
canonical as (
  select norm_title, norm_author, id as canonical_id
  from ranked
  where rn = 1
),
dupe_map as (
  select r.id as duplicate_id, c.canonical_id
  from ranked r
  join canonical c
    on r.norm_title = c.norm_title and r.norm_author = c.norm_author
  where r.rn > 1
),
ub_delete as (
  -- Same user already has the canonical book too — drop the duplicate's
  -- library entry rather than repoint it (would violate the unique
  -- (user_id, book_id) constraint).
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
  -- Otherwise, repoint the library entry to the canonical book.
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
  -- Same tier list already has the canonical book placed too — drop the
  -- duplicate's placement (would violate the unique
  -- (tier_list_id, book_id) constraint).
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
  -- Otherwise, repoint the placement to the canonical book.
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
-- Now safe to delete the duplicate book rows — nothing references them
-- anymore once the CTEs above have run.
delete from books
where id in (select duplicate_id from dupe_map);
