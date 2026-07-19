-- Backs the new "Custom Order" library sort (drag-to-reorder, same
-- dnd-kit machinery the tier board already uses) — same position-column
-- pattern tier_list_items already has, just on user_books instead.
alter table user_books
  add column if not exists position integer not null default 0;

-- Backfill so Custom Order starts out matching each user's existing
-- Recently-Added order rather than every row being tied at 0 — the first
-- drag a user makes should feel like "I moved this one book," not "the
-- whole shelf just randomly reshuffled."
with numbered as (
  select
    id,
    row_number() over (partition by user_id order by created_at) - 1 as rn
  from user_books
)
update user_books
set position = numbered.rn
from numbered
where user_books.id = numbered.id;
