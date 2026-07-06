alter table tier_lists
  add column if not exists is_public boolean not null default false;

create policy "Public tier lists are viewable by anyone"
  on tier_lists for select
  to public
  using (is_public = true);

create policy "Items in public tier lists are viewable by anyone"
  on tier_list_items for select
  to public
  using (
    exists (
      select 1 from tier_lists
      where tier_lists.id = tier_list_items.tier_list_id
        and tier_lists.is_public = true
    )
  );
