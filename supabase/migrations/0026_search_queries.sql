-- Logs each book search so a real "Trending Searches" panel can be built
-- from actual usage instead of a fabricated/static list (design2/02).
create table if not exists search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table search_queries enable row level security;

-- Aggregated trending terms are shown to every signed-in user, not just the
-- person who searched them.
create policy "Search queries are viewable by authenticated users"
  on search_queries for select
  to authenticated
  using (true);

create policy "Authenticated users can log a search"
  on search_queries for insert
  to authenticated
  with check (true);
