-- Sprint 9 performance audit: only 2 of the previous 32 migrations created
-- any index at all (notifications, recommendation_outcomes — both added
-- when those tables were built). Every earlier table relies solely on its
-- primary key, or an incidental unique constraint whose leading column
-- happens to match how the app queries it. This fills the real gaps —
-- columns with zero index coverage that the app filters on constantly.

-- tier_lists.user_id: no coverage at all. Filtered directly by
-- getUserListCards (Explore feed, Profile Lists tab, /u/[username]),
-- getFavoriteBooks, getBookScores (backs every Compare/taste-match
-- calculation), and cleanupAbandonedDrafts — the single most-queried
-- column gap found in this audit. RLS also implicitly adds
-- "user_id = auth.uid()" to every plain select against this table, so
-- this index helps even queries that don't filter on it explicitly in
-- application code.
create index if not exists tier_lists_user_id_idx
  on tier_lists (user_id);

-- tier_list_items.book_id: the existing unique(tier_list_id, book_id)
-- constraint only accelerates lookups that filter by tier_list_id (its
-- leading column) — a book_id-only filter can't use it. Confirmed one
-- real query does exactly that: deleteOrphanedDraftBooks (lists/actions.ts)
-- checks whether a book is referenced anywhere, not scoped to one list,
-- every time a draft list is discarded.
create index if not exists tier_list_items_book_id_idx
  on tier_list_items (book_id);

-- list_comments.tier_list_id: no coverage at all. Filtered every time a
-- list detail page loads its comment thread.
create index if not exists list_comments_tier_list_id_idx
  on list_comments (tier_list_id);

-- search_queries.created_at: no coverage at all, and this table only
-- grows (every search logs a row, nothing ever deletes from it).
-- getTrendingSearches range-scans the last 30 days and sorts by this
-- column on every Explore/Search page load that shows the Trending
-- Searches rail — an unindexed sort that gets slower as the table grows.
create index if not exists search_queries_created_at_idx
  on search_queries (created_at desc);
