-- A second round of duplicate-book merging, same reasoning and shape as
-- 0020, for 5 pairs that its normalized-title+author query didn't catch:
-- format differences 0020's plain lower(trim(...)) didn't account for, not
-- genuinely different books.
--
--   Harry Potter and the Half-Blood Prince — "J.K. Rowling" vs "J. K. Rowling"
--   Harry Potter and the Sorcerer's Stone   — "J.K. Rowling" vs "J. K. Rowling"
--   Mistborn                                — 3 rows: "Mistborn", "Mistborn: The
--                                              Final Empire", and "The Final Empire"
--                                              (its own subtitle, standalone)
--   A Court of Mist and Fury                — plain title vs "... (a Court of Thorns and Roses, 2)"
--   The Sword of Kaigen                     — plain title vs "... A Theonite War Story"
--
-- Written as an explicit mapping rather than a fuzzy-normalized query —
-- only 5 pairs, already verified by hand (canonical pick uses 0020's same
-- description-then-thumbnail-then-oldest priority), and a generic regex
-- loose enough to catch both the author-spacing and title-subtitle cases at
-- once risks over-matching unrelated books. Unlike 0020's original batch,
-- every row on both sides of these 5 pairs has real user_books/
-- tier_list_items references from actual accounts — this is genuinely
-- splitting shared-book counts between people who ranked the "same" book
-- under different rows, not just orphaned clutter.
with dupe_map (duplicate_id, canonical_id) as (
  values
    ('7bc94920-c510-4b0d-a8df-e1d49cd8fa10'::uuid, 'ccf1952c-5aca-47b1-932c-0c3a0502a0f2'::uuid), -- Half-Blood Prince
    ('962ad0a0-0cce-4139-91d4-77396f2e8fe5'::uuid, '765df6e3-7a07-4432-b675-6a481a9c3228'::uuid), -- Sorcerer's Stone
    ('448e41a8-dd1b-4480-86ab-c139ea3f15f5'::uuid, '4d1e93e7-c033-455b-bc01-04944233c0d5'::uuid), -- Mistborn: The Final Empire
    ('66b1361f-273e-4adc-8b4f-5f4e84c0303f'::uuid, '4d1e93e7-c033-455b-bc01-04944233c0d5'::uuid), -- The Final Empire
    ('fcfc668b-4a1e-4b27-9cea-bd7528f8300f'::uuid, 'cc53b317-8ea5-4de5-835e-b5e89957ae02'::uuid), -- A Court of Mist and Fury
    ('78bd0b6e-65cb-4b0c-9112-cf0fa202d19b'::uuid, 'a0e906df-b459-47ad-8cd3-7df7b48da39b'::uuid)   -- The Sword of Kaigen
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
