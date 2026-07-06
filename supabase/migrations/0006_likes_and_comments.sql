create table if not exists list_likes (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references tier_lists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tier_list_id, user_id)
);

alter table list_likes enable row level security;

create policy "Users can view their own likes"
  on list_likes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can like visible lists"
  on list_likes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from tier_lists
      where tier_lists.id = list_likes.tier_list_id
        and (tier_lists.is_public = true or tier_lists.user_id = auth.uid())
    )
  );

create policy "Users can remove their own likes"
  on list_likes for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists list_comments (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references tier_lists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table list_comments enable row level security;

create policy "Comments are viewable on visible lists"
  on list_comments for select
  to public
  using (
    exists (
      select 1 from tier_lists
      where tier_lists.id = list_comments.tier_list_id
        and (tier_lists.is_public = true or tier_lists.user_id = auth.uid())
    )
  );

create policy "Users can comment on visible lists"
  on list_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from tier_lists
      where tier_lists.id = list_comments.tier_list_id
        and (tier_lists.is_public = true or tier_lists.user_id = auth.uid())
    )
  );

create policy "Users can delete their own comments"
  on list_comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- Keep tier_lists.like_count / comment_count in sync automatically, so the
-- count can only change as a real side effect of an actual like/comment
-- being added or removed (not via a directly-callable increment).
create or replace function tg_adjust_list_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update tier_lists set like_count = like_count + 1 where id = new.tier_list_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update tier_lists set like_count = greatest(like_count - 1, 0) where id = old.tier_list_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists list_likes_count_trigger on list_likes;
create trigger list_likes_count_trigger
  after insert or delete on list_likes
  for each row execute function tg_adjust_list_like_count();

create or replace function tg_adjust_list_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update tier_lists set comment_count = comment_count + 1 where id = new.tier_list_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update tier_lists set comment_count = greatest(comment_count - 1, 0) where id = old.tier_list_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists list_comments_count_trigger on list_comments;
create trigger list_comments_count_trigger
  after insert or delete on list_comments
  for each row execute function tg_adjust_list_comment_count();
