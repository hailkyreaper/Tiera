-- Anonymous auth (Supabase's built-in signInAnonymously(), enabled for the
-- new "/" continue-without-an-account flow) shares the `authenticated`
-- role with real accounts — RLS can only tell them apart via the JWT's
-- `is_anonymous` claim. Comments and likes are both public, feed-visible
-- content/counters (shown on every list card site-wide), so both are
-- restricted to permanent accounts only — Supabase's own recommended
-- pattern for protecting public content from disposable-anonymous-account
-- abuse (their docs' own example restricts inserts to a "news_feed" table
-- the same way). Ranking books and creating lists are deliberately left
-- unrestricted: letting an anonymous visitor actually use the core product
-- ("you can rank and browse right away") is the whole point of the
-- feature, not something to quietly undercut here.

drop policy if exists "Users can comment on visible lists" on list_comments;
create policy "Only permanent users can comment on visible lists"
  on list_comments for insert
  to authenticated
  with check (
    (select (auth.jwt()->>'is_anonymous')::boolean) is false
    and auth.uid() = user_id
    and exists (
      select 1 from tier_lists
      where tier_lists.id = list_comments.tier_list_id
        and (tier_lists.is_public = true or tier_lists.user_id = auth.uid())
    )
  );

drop policy if exists "Users can like visible lists" on list_likes;
create policy "Only permanent users can like visible lists"
  on list_likes for insert
  to authenticated
  with check (
    (select (auth.jwt()->>'is_anonymous')::boolean) is false
    and auth.uid() = user_id
    and exists (
      select 1 from tier_lists
      where tier_lists.id = list_likes.tier_list_id
        and (tier_lists.is_public = true or tier_lists.user_id = auth.uid())
    )
  );
