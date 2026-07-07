alter table books
  add column if not exists categories text[];

-- Supabase grants broad table-level privileges by default and relies on RLS
-- for row access, so we revoke the blanket UPDATE grant and re-grant it only
-- on the categories column — this lets any signed-in user help keep this
-- shared field in sync without being able to touch anything else on a book.
revoke update on books from authenticated;
grant update (categories) on books to authenticated;

create policy "Authenticated users can update book categories"
  on books for update
  to authenticated
  using (true)
  with check (true);
