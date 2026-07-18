create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('follow', 'comment', 'like')),
  tier_list_id uuid references tier_lists (id) on delete cascade,
  comment_id uuid references list_comments (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

-- No insert policy for `authenticated` at all — every row is written by the
-- security-definer trigger functions below (same pattern as
-- tg_adjust_list_like_count/tg_adjust_list_comment_count in migration 0006),
-- never directly by application code, so the acting user never needs their
-- own insert grant on a table that isn't theirs (the recipient is someone
-- else entirely).
create policy "Users can view their own notifications"
  on notifications for select
  to authenticated
  using (auth.uid() = recipient_id);

create policy "Users can mark their own notifications read"
  on notifications for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create index if not exists notifications_recipient_created_at_idx
  on notifications (recipient_id, created_at desc);

-- Follows: self-follow is already impossible (follows' own check constraint),
-- so no self-notify guard needed here.
create or replace function tg_notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (recipient_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$;

drop trigger if exists follows_notify_trigger on follows;
create trigger follows_notify_trigger
  after insert on follows
  for each row execute function tg_notify_on_follow();

-- Comments/likes: unlike follow, you can comment on or like your own list,
-- so both guard against notifying yourself.
create or replace function tg_notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from tier_lists where id = new.tier_list_id;

  if owner_id is not null and owner_id != new.user_id then
    insert into notifications (recipient_id, actor_id, type, tier_list_id, comment_id)
    values (owner_id, new.user_id, 'comment', new.tier_list_id, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists list_comments_notify_trigger on list_comments;
create trigger list_comments_notify_trigger
  after insert on list_comments
  for each row execute function tg_notify_on_comment();

create or replace function tg_notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from tier_lists where id = new.tier_list_id;

  if owner_id is not null and owner_id != new.user_id then
    insert into notifications (recipient_id, actor_id, type, tier_list_id)
    values (owner_id, new.user_id, 'like', new.tier_list_id);
  end if;

  return new;
end;
$$;

drop trigger if exists list_likes_notify_trigger on list_likes;
create trigger list_likes_notify_trigger
  after insert on list_likes
  for each row execute function tg_notify_on_like();
