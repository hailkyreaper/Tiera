alter table tier_lists
  add column if not exists description text,
  add column if not exists tags text[];
