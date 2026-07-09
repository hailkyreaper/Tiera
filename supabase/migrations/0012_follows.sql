create table if not exists follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

alter table follows enable row level security;

create policy "Follows are viewable by everyone"
  on follows for select
  to public
  using (true);

create policy "Users can follow others"
  on follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete
  to authenticated
  using (auth.uid() = follower_id);
