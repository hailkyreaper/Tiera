create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  google_volume_id text unique not null,
  title text not null,
  authors text[],
  description text,
  thumbnail_url text,
  published_date text,
  page_count integer,
  average_rating numeric,
  created_at timestamptz not null default now()
);

alter table books enable row level security;

create policy "Books are viewable by everyone"
  on books for select
  using (true);

create policy "Authenticated users can add books"
  on books for insert
  to authenticated
  with check (true);
