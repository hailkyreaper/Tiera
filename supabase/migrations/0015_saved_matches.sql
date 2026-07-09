-- Backs the "Save Match" button on the Compare detail page (Sprint 5
-- addendum). Private to the viewer — saving a match is not something the
-- other person needs to see, unlike follows.
create table if not exists saved_matches (
  viewer_id uuid not null references auth.users (id) on delete cascade,
  saved_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (viewer_id, saved_user_id),
  check (viewer_id != saved_user_id)
);

alter table saved_matches enable row level security;

create policy "Users can view their own saved matches"
  on saved_matches for select
  to authenticated
  using (auth.uid() = viewer_id);

create policy "Users can save a match"
  on saved_matches for insert
  to authenticated
  with check (auth.uid() = viewer_id);

create policy "Users can unsave a match"
  on saved_matches for delete
  to authenticated
  using (auth.uid() = viewer_id);
