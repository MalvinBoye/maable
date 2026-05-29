-- ============================================================
-- Leaderboard views + friend request RLS
-- ============================================================
-- Applied separately from init_schema since migration 2 was
-- marked applied without running on this project.

create or replace view public.leaderboard_global with (security_invoker = true) as
  select
    p.id          as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.total_xp,
    p.level,
    p.current_skin_id,
    row_number() over (order by p.total_xp desc) as rank
  from public.profiles p
  order by p.total_xp desc
  limit 100;

create or replace view public.leaderboard_friends with (security_invoker = true) as
  select
    p.id          as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.total_xp,
    p.level,
    p.current_skin_id,
    auth.uid()    as viewer_user_id,
    row_number() over (order by p.total_xp desc) as rank
  from public.profiles p
  where
    p.id = auth.uid()
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = p.id) or
          (f.addressee_id = auth.uid() and f.requester_id = p.id)
        )
    )
  order by p.total_xp desc;

-- RLS for friendships (in case it wasn't applied)
alter table public.friendships enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'friendships' and policyname = 'friendships_own'
  ) then
    execute $pol$
      create policy "friendships_own"
        on public.friendships for all
        using (auth.uid() = requester_id or auth.uid() = addressee_id)
    $pol$;
  end if;
end $$;
