-- Guards against gaming Explore's Recent sort by scripting repeated calls
-- to moveBookToTier/addBookToTier/etc. in a loop to keep a list pinned at
-- the top forever. Adds a cooldown to the trigger from migration 0024: it
-- only actually bumps tier_lists.updated_at if the existing value is more
-- than 15 minutes old, so rapid automated writes collapse into a single
-- bump instead of refreshing the timestamp on every single write. A real
-- editing session (adding several books in a row) still reads as "just
-- updated" from its first bump — there's no need for sub-15-minute
-- granularity for Recent to feel accurate.
create or replace function tg_touch_tier_list_updated_at_from_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update tier_lists
  set updated_at = now()
  where id = coalesce(new.tier_list_id, old.tier_list_id)
    and updated_at < now() - interval '15 minutes';
  return coalesce(new, old);
end;
$$;
