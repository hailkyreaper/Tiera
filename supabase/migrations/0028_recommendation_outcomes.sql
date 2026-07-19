-- Event log for every recommendation actually shown to a user, plus its
-- eventual real-world outcome (did they add it, did they ever rank it, what
-- did they rate it). Built to answer a specific product question before
-- investing more in the matching algorithm: does a higher match %/shared-
-- book-count pairing actually produce recommendations people end up loving,
-- or is that assumption untested? V2 algorithm work (e.g. per-genre-cluster
-- matching) is backlogged until this data exists to justify it.
--
-- Several fields from the original proposal don't map to anything this app
-- tracks today and were deliberately left out rather than added as
-- permanently-null columns: saved_to_tbr (no "want to read" shelf concept
-- exists — see CLAUDE.md's topmatches.png note), opened_book_page/
-- started_reading/finished_reading/days_until_started/days_until_finished
-- (no reading-status tracking exists at all — this is a tier-ranking app,
-- not a reading-progress tracker), liked_recommendation/
-- would_recommend_again (no thumbs-up/down UI exists on a recommendation
-- row). Add them in a follow-up migration if those features get built.
create table if not exists recommendation_outcomes (
  id uuid primary key default gen_random_uuid(),
  viewer_user_id uuid not null references auth.users (id) on delete cascade,
  -- Nullable: the standalone Recommendations page aggregates across a pool
  -- of similar users and dedupes by book, so a given recommended book isn't
  -- always attributable to exactly one source — null there is honest, not
  -- a bug.
  source_user_id uuid references auth.users (id) on delete set null,
  recommended_book_id uuid not null references books (id) on delete cascade,
  recommendation_source text not null check (
    recommendation_source in ('compare_detail', 'standalone', 'profile_rail')
  ),

  -- Snapshot of the numbers that justified showing this recommendation, at
  -- the time it was (most recently) shown — this is the input side of the
  -- eventual "did a higher number actually mean anything" analysis.
  viewer_match_percentage int,
  shared_book_count int,
  viewer_books_ranked int,
  source_books_ranked int,
  shared_favorites_count int,
  shared_dislikes_count int,
  disagreements_count int,

  first_recommended_at timestamptz not null default now(),
  last_recommended_at timestamptz not null default now(),

  clicked boolean not null default false,
  clicked_at timestamptz,

  -- Filled in later by the trigger below, whenever/if the viewer actually
  -- ranks this exact book in any of their own tier lists.
  viewer_final_tier text,
  viewer_final_score numeric,
  rated_at timestamptz,

  -- One row per (viewer, book, surface) — re-showing the same
  -- recommendation on the same surface refreshes this row instead of
  -- piling up duplicate impressions; a different surface recommending the
  -- same book is a genuinely separate data point worth keeping.
  unique (viewer_user_id, recommended_book_id, recommendation_source)
);

alter table recommendation_outcomes enable row level security;

-- Every recommendation is rendered under the viewer's own session, so the
-- viewer is always the one both inserting the impression row and later
-- flipping `clicked` — never the source user, who has no reason to write
-- here at all.
create policy "Users can log their own recommendation impressions"
  on recommendation_outcomes for insert
  to authenticated
  with check (auth.uid() = viewer_user_id);

create policy "Users can update their own recommendation outcomes"
  on recommendation_outcomes for update
  to authenticated
  using (auth.uid() = viewer_user_id)
  with check (auth.uid() = viewer_user_id);

-- Read access is admin-only — this table exists purely for internal
-- product analysis, not anything user-facing.
create policy "Admins can view all recommendation outcomes"
  on recommendation_outcomes for select
  to authenticated
  using (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

create index if not exists recommendation_outcomes_viewer_idx
  on recommendation_outcomes (viewer_user_id);
create index if not exists recommendation_outcomes_book_idx
  on recommendation_outcomes (recommended_book_id);

-- Auto-fills the outcome side whenever a viewer ranks a book that was
-- recommended to them, regardless of which of the many app code paths did
-- the ranking (search add, library add, drag-and-drop tier move, CSV
-- import, AI photo import, etc.) — a trigger is the only way to catch all
-- of those without instrumenting every single one individually. Only ever
-- sets the outcome once (`viewer_final_tier is null` guard) — a book's
-- *first* real rating after being recommended is the meaningful signal;
-- someone re-tiering it later shouldn't silently rewrite already-collected
-- analysis data.
create or replace function tg_update_recommendation_outcome_on_rank()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  tier_score int;
  tier_scores jsonb := '{"S":6,"A":5,"B":4,"C":3,"D":2,"F":1}'::jsonb;
begin
  if new.tier = 'unranked' then
    return new;
  end if;

  select user_id into owner_id from tier_lists where id = new.tier_list_id;
  if owner_id is null then
    return new;
  end if;

  tier_score := (tier_scores ->> new.tier)::int;
  if tier_score is null then
    return new;
  end if;

  update recommendation_outcomes
  set viewer_final_tier = new.tier,
      viewer_final_score = tier_score,
      rated_at = now()
  where viewer_user_id = owner_id
    and recommended_book_id = new.book_id
    and viewer_final_tier is null;

  return new;
end;
$$;

drop trigger if exists tier_list_items_recommendation_outcome_trigger
  on tier_list_items;
create trigger tier_list_items_recommendation_outcome_trigger
  after insert or update on tier_list_items
  for each row execute function tg_update_recommendation_outcome_on_rank();
