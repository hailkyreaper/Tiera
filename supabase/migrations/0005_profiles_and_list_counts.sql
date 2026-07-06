create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on profiles (lower(username));

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  to public
  using (true);

create policy "Users can create their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table tier_lists
  add column if not exists like_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;
