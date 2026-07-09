-- Repairs saved_matches policies in case only "enable row level security"
-- ran from 0015's script (e.g. via a SQL editor's one-click RLS prompt)
-- without the CREATE POLICY statements that followed it.
drop policy if exists "Users can view their own saved matches" on saved_matches;
drop policy if exists "Users can save a match" on saved_matches;
drop policy if exists "Users can unsave a match" on saved_matches;

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
