-- Backs the admin/role check for /admin/backfill-categories, which
-- previously had no gate at all beyond "is logged in". No self-service way
-- to grant this — set it manually for your own account after running this:
--   update profiles set is_admin = true where id = auth.uid();
alter table profiles
  add column if not exists is_admin boolean not null default false;
