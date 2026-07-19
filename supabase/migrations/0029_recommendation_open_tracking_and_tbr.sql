-- Two independent additions, bundled since both came from the same
-- feedback-instrumentation discussion:
--
-- 1. opened_book_page/opened_at on recommendation_outcomes — migration
--    0028's own comment flagged this as "doesn't map to anything this app
--    tracks today," since no recommendation row linked to a book detail
--    view. That's no longer true: RecommendationRow now opens
--    BookDetailDrawer, giving a real middle funnel stage between "shown"
--    and "added" (did they even consider it, or was it ignored outright).
alter table recommendation_outcomes
  add column if not exists opened_book_page boolean not null default false,
  add column if not exists opened_at timestamptz;

-- 2. want_to_read on user_books — a minimal "To Be Read" shelf. Deliberately
-- a flag on the existing library relationship rather than a new table: a
-- TBR book *is* a library book in this app's model, just one not yet
-- ranked, so there's no need for a separate concept/table.
alter table user_books
  add column if not exists want_to_read boolean not null default false;

-- user_books already only grants owner-scoped select/insert/delete to
-- authenticated users (original schema) — this is a plain column on that
-- same table, no new grant needed for select. Insert already covers new
-- values for this column since it's part of the same row; update needs a
-- fresh grant since user_books previously had no UPDATE policy at all (rows
-- were only ever inserted/deleted, never modified in place).
create policy "Users can update their own library flags"
  on user_books for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
