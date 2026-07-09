-- Lists are created eagerly (the moment you tap the center nav button, before
-- any details or Save) so books can be added to them right away. Without a
-- flag, that eager-created row immediately counts and shows on the owner's
-- profile even if they never press Save. is_draft marks it as not-yet-saved;
-- updateListDetails flips it to false when Save is actually pressed.
alter table tier_lists
  add column if not exists is_draft boolean not null default true;
