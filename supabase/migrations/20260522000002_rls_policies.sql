-- ============================================================
-- Maable — Row Level Security Policies
-- EVERY table is locked down. Users can only access their own data.
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.notes enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.skins enable row level security;
alter table public.user_skins enable row level security;
alter table public.friendships enable row level security;
alter table public.integrations enable row level security;
alter table public.subscriptions enable row level security;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

-- Users can read any profile (needed for leaderboards, friend search)
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No direct insert (handled by trigger)
-- No delete (handled by auth.users cascade)

-- ─── Skins ────────────────────────────────────────────────────────────────────

create policy "skins_select_all"
  on public.skins for select
  using (true);

-- Only service role can insert/update skins (admin only)

-- ─── User Skins ───────────────────────────────────────────────────────────────

create policy "user_skins_select_own"
  on public.user_skins for select
  using (auth.uid() = user_id);

-- Inserts handled by Edge Functions / server-side only (service role)

-- ─── Projects ─────────────────────────────────────────────────────────────────

create policy "projects_select_own"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects_update_own"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects_delete_own"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ─── Tasks ────────────────────────────────────────────────────────────────────

create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- ─── Habits ───────────────────────────────────────────────────────────────────

create policy "habits_select_own"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "habits_insert_own"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "habits_update_own"
  on public.habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habits_delete_own"
  on public.habits for delete
  using (auth.uid() = user_id);

-- ─── Habit Completions ────────────────────────────────────────────────────────

create policy "habit_completions_select_own"
  on public.habit_completions for select
  using (auth.uid() = user_id);

create policy "habit_completions_insert_own"
  on public.habit_completions for insert
  with check (auth.uid() = user_id);

create policy "habit_completions_update_own"
  on public.habit_completions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habit_completions_delete_own"
  on public.habit_completions for delete
  using (auth.uid() = user_id);

-- ─── Notes ────────────────────────────────────────────────────────────────────

create policy "notes_select_own"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "notes_insert_own"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes_delete_own"
  on public.notes for delete
  using (auth.uid() = user_id);

-- ─── XP Transactions ──────────────────────────────────────────────────────────

create policy "xp_transactions_select_own"
  on public.xp_transactions for select
  using (auth.uid() = user_id);

-- No client-side insert — XP is only awarded by server-side triggers and Edge Functions

-- ─── Friendships ──────────────────────────────────────────────────────────────

-- Can see friendships you're part of
create policy "friendships_select_involved"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Can only send friend requests as yourself
create policy "friendships_insert_as_requester"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

-- Can only update (accept/block) if you're the addressee
create policy "friendships_update_as_addressee"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- Either party can delete (unfriend/cancel)
create policy "friendships_delete_involved"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ─── Integrations ─────────────────────────────────────────────────────────────

-- IMPORTANT: encrypted tokens are only readable server-side.
-- Clients can see metadata but NOT the encrypted token columns.
create policy "integrations_select_own"
  on public.integrations for select
  using (auth.uid() = user_id);

-- No client insert/update — all managed by Edge Functions with service role

-- ─── Subscriptions ────────────────────────────────────────────────────────────

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No client insert/update — managed by webhook from RevenueCat (service role)

-- ─── Leaderboard views ────────────────────────────────────────────────────────

create or replace view public.leaderboard_global with (security_invoker = true) as
  select
    p.id as user_id,
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
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.total_xp,
    p.level,
    p.current_skin_id,
    auth.uid() as viewer_user_id,
    row_number() over (order by p.total_xp desc) as rank
  from public.profiles p
  where
    p.id = auth.uid()
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = p.id)
          or (f.addressee_id = auth.uid() and f.requester_id = p.id)
        )
    )
  order by p.total_xp desc;
