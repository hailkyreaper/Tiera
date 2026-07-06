create table if not exists tier_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'My Tier List',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tier_lists enable row level security;

create policy "Users can view their own tier lists"
  on tier_lists for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own tier lists"
  on tier_lists for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own tier lists"
  on tier_lists for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tier lists"
  on tier_lists for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists tier_list_items (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references tier_lists (id) on delete cascade,
  book_id uuid not null references books (id) on delete cascade,
  tier text not null default 'unranked'
    check (tier in ('S', 'A', 'B', 'C', 'D', 'F', 'unranked')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tier_list_id, book_id)
);

alter table tier_list_items enable row level security;

create policy "Users can view items in their own tier lists"
  on tier_list_items for select
  to authenticated
  using (
    exists (
      select 1 from tier_lists
      where tier_lists.id = tier_list_items.tier_list_id
        and tier_lists.user_id = auth.uid()
    )
  );

create policy "Users can add items to their own tier lists"
  on tier_list_items for insert
  to authenticated
  with check (
    exists (
      select 1 from tier_lists
      where tier_lists.id = tier_list_items.tier_list_id
        and tier_lists.user_id = auth.uid()
    )
  );

create policy "Users can update items in their own tier lists"
  on tier_list_items for update
  to authenticated
  using (
    exists (
      select 1 from tier_lists
      where tier_lists.id = tier_list_items.tier_list_id
        and tier_lists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from tier_lists
      where tier_lists.id = tier_list_items.tier_list_id
        and tier_lists.user_id = auth.uid()
    )
  );

create policy "Users can remove items from their own tier lists"
  on tier_list_items for delete
  to authenticated
  using (
    exists (
      select 1 from tier_lists
      where tier_lists.id = tier_list_items.tier_list_id
        and tier_lists.user_id = auth.uid()
    )
  );
