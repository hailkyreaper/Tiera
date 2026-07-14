-- tier_lists.updated_at has existed since 0003 but nothing ever actually
-- set it — every mutation (ranking a book, moving it between tiers,
-- removing it, reordering, Goodreads/AI import) only ever touched
-- tier_list_items, never the parent row, so it silently stayed pinned at
-- created_at forever. Explore's "Recent" sort needs a real "last edited"
-- signal, not just "first created". A table-level trigger on
-- tier_list_items (rather than scattering `updated_at` writes across every
-- current and future mutation call site) means nothing can forget to bump
-- it later — same reasoning as the existing list_likes_count_trigger /
-- list_comments_count_trigger pattern just below it in migration 0006.
-- Deliberately NOT a blanket "any tier_lists row update" trigger: that would
-- also fire from those same like/comment count triggers writing to
-- tier_lists, incorrectly bumping "last edited" every time someone else
-- likes or comments on a list that hasn't actually changed.
create or replace function tg_touch_tier_list_updated_at_from_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update tier_lists
  set updated_at = now()
  where id = coalesce(new.tier_list_id, old.tier_list_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists tier_list_items_touch_parent_updated_at on tier_list_items;
create trigger tier_list_items_touch_parent_updated_at
  after insert or update or delete on tier_list_items
  for each row execute function tg_touch_tier_list_updated_at_from_items();
