create table if not exists user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references books (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

alter table user_books enable row level security;

create policy "Users can view their own library"
  on user_books for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add to their own library"
  on user_books for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove from their own library"
  on user_books for delete
  to authenticated
  using (auth.uid() = user_id);
