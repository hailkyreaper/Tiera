-- Goodreads CSV import creates real `books` catalog rows immediately (a
-- tier_list_items row can't reference a book that doesn't exist yet), even
-- though the surrounding list is still an unsaved draft — that meant a bad
-- or half-finished import could pollute the shared, app-wide book catalog
-- (visible to everyone's search) before the user ever decided to keep it.
--
-- `is_draft` marks a freshly-created import row as unconfirmed. Search
-- (searchLocalBooks) filters it out; saving the list (saveListFields) flips
-- it back to false for every book on that list; canceling an unsaved draft
-- deletes any of its books that are still is_draft and unreferenced
-- elsewhere. Matched books (dedup found an existing catalog row) are never
-- touched, so this only ever affects genuinely new rows an import created.
alter table books
  add column if not exists is_draft boolean not null default false;

revoke update on books from authenticated;
grant update (categories, thumbnail_url, description, is_draft) on books to authenticated;

-- DELETE has no column-level grant, so this relies entirely on the RLS
-- USING clause below to restrict it to draft rows — a confirmed
-- (is_draft = false) book can never be deleted by an app-level action.
grant delete on books to authenticated;

create policy "Authenticated users can delete draft books"
  on books for delete
  to authenticated
  using (is_draft = true);
