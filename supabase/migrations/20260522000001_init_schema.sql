-- ============================================================
-- Maable — Initial Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_status as enum ('todo', 'in_progress', 'done', 'archived');
create type habit_frequency as enum ('daily', 'weekly', 'custom');
create type subscription_tier as enum ('free', 'pro', 'premium');
create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
create type integration_provider as enum ('linkedin', 'canvas', 'managebac', 'google_calendar');
create type friendship_status as enum ('pending', 'accepted', 'blocked');
create type xp_source as enum (
  'task_complete', 'habit_complete', 'streak_bonus', 'note_created',
  'daily_login', 'challenge_complete', 'level_up_bonus'
);

-- ─── Profiles ─────────────────────────────────────────────────────────────────

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text not null unique,
  display_name    text not null,
  avatar_url      text,
  bio             text,
  subscription_tier subscription_tier not null default 'free',
  total_xp        integer not null default 0 check (total_xp >= 0),
  level           integer not null default 1 check (level >= 1),
  current_skin_id uuid,
  timezone        text not null default 'UTC',
  onboarding_complete boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Username constraints
alter table public.profiles
  add constraint username_length check (char_length(username) between 3 and 30),
  add constraint username_format check (username ~ '^[a-zA-Z0-9_]+$');

-- ─── Skins ────────────────────────────────────────────────────────────────────

create table public.skins (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  description     text,
  preview_url     text,
  price_credits   integer not null default 0 check (price_credits >= 0),
  is_default      boolean not null default false,
  theme_config    jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

-- Insert the default skin
insert into public.skins (name, slug, description, is_default, theme_config) values (
  'Maable Classic', 'maable-classic', 'The original Maable look.', true,
  '{"colors": {"primary": "#6366f1", "secondary": "#8b5cf6", "accent": "#06b6d4", "xpBar": "#f59e0b"}}'
);

-- FK back to skins
alter table public.profiles
  add constraint fk_profile_skin foreign key (current_skin_id) references public.skins(id) on delete set null;

-- ─── User Skins ───────────────────────────────────────────────────────────────

create table public.user_skins (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  skin_id      uuid not null references public.skins(id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  unique (user_id, skin_id)
);

-- ─── Projects ─────────────────────────────────────────────────────────────────

create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  description text,
  color       text not null default '#6366f1',
  icon        text,
  is_archived boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_projects_user_id on public.projects(user_id);

-- ─── Tasks ────────────────────────────────────────────────────────────────────

create table public.tasks (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 500),
  description    text,
  status         task_status not null default 'todo',
  priority       task_priority not null default 'medium',
  due_date       date,
  due_time       time,
  reminder_at    timestamptz,
  tags           text[] not null default '{}',
  xp_reward      integer not null default 25 check (xp_reward >= 0),
  sort_order     integer not null default 0,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_date on public.tasks(due_date);

-- Auto-set completed_at
create or replace function set_task_completed_at()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'done' and old.status <> 'done' then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger trg_task_completed_at
  before update on public.tasks
  for each row execute function set_task_completed_at();

-- ─── Habits ───────────────────────────────────────────────────────────────────

create table public.habits (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 200),
  description     text,
  icon            text,
  color           text not null default '#6366f1',
  frequency       habit_frequency not null default 'daily',
  frequency_days  integer[],
  target_count    integer not null default 1 check (target_count >= 1),
  xp_reward       integer not null default 20 check (xp_reward >= 0),
  current_streak  integer not null default 0 check (current_streak >= 0),
  longest_streak  integer not null default 0 check (longest_streak >= 0),
  is_archived     boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_habits_user_id on public.habits(user_id);

create table public.habit_completions (
  id              uuid primary key default uuid_generate_v4(),
  habit_id        uuid not null references public.habits(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  completed_date  date not null,
  count           integer not null default 1 check (count >= 1),
  note            text,
  created_at      timestamptz not null default now(),
  unique (habit_id, completed_date)
);

create index idx_habit_completions_user_id on public.habit_completions(user_id);
create index idx_habit_completions_date on public.habit_completions(completed_date);

-- ─── Notes ────────────────────────────────────────────────────────────────────

create table public.notes (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete set null,
  task_id         uuid references public.tasks(id) on delete set null,
  title           text not null default 'Untitled' check (char_length(title) <= 500),
  content         jsonb not null default '{}',
  content_text    text,
  tags            text[] not null default '{}',
  is_pinned       boolean not null default false,
  is_archived     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_content_text on public.notes using gin(to_tsvector('english', coalesce(content_text, '')));

-- ─── XP Transactions ──────────────────────────────────────────────────────────

create table public.xp_transactions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  source     xp_source not null,
  amount     integer not null check (amount > 0),
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index idx_xp_transactions_user_id on public.xp_transactions(user_id);
create index idx_xp_transactions_created_at on public.xp_transactions(created_at);

-- Auto-update total_xp on profile when XP is added
create or replace function update_profile_xp()
returns trigger language plpgsql security definer as $$
declare
  new_xp integer;
  new_level integer;
begin
  update public.profiles
    set
      total_xp = total_xp + new.amount,
      level    = floor((total_xp + new.amount) / 1000) + 1,
      updated_at = now()
    where id = new.user_id
    returning total_xp into new_xp;
  return new;
end;
$$;

create trigger trg_xp_transaction_update_profile
  after insert on public.xp_transactions
  for each row execute function update_profile_xp();

-- ─── Friendships ──────────────────────────────────────────────────────────────

create table public.friendships (
  id            uuid primary key default uuid_generate_v4(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        friendship_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index idx_friendships_requester on public.friendships(requester_id);
create index idx_friendships_addressee on public.friendships(addressee_id);

-- ─── Integrations ─────────────────────────────────────────────────────────────

create table public.integrations (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  provider                 integration_provider not null,
  provider_user_id         text,
  access_token_encrypted   text not null,       -- AES-256 via pgcrypto, never store raw
  refresh_token_encrypted  text,
  token_expires_at         timestamptz,
  scopes                   text[] not null default '{}',
  is_active                boolean not null default true,
  last_synced_at           timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, provider)
);

create index idx_integrations_user_id on public.integrations(user_id);

-- ─── Subscriptions ────────────────────────────────────────────────────────────

create table public.subscriptions (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  tier                     subscription_tier not null default 'free',
  status                   subscription_status not null default 'active',
  platform                 text not null check (platform in ('ios', 'web', 'android')),
  provider_subscription_id text,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  canceled_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);

-- ─── updated_at triggers ──────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles for each row execute function set_updated_at();
create trigger trg_projects_updated_at before update on public.projects for each row execute function set_updated_at();
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function set_updated_at();
create trigger trg_habits_updated_at before update on public.habits for each row execute function set_updated_at();
create trigger trg_notes_updated_at before update on public.notes for each row execute function set_updated_at();
create trigger trg_friendships_updated_at before update on public.friendships for each row execute function set_updated_at();
create trigger trg_integrations_updated_at before update on public.integrations for each row execute function set_updated_at();
create trigger trg_subscriptions_updated_at before update on public.subscriptions for each row execute function set_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  default_skin_id uuid;
  base_username text;
  final_username text;
  counter integer := 0;
begin
  select id into default_skin_id from public.skins where is_default = true limit 1;

  -- Use provided username or derive from email
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  -- Sanitize
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  base_username := left(base_username, 28);
  if char_length(base_username) < 3 then
    base_username := 'user' || base_username;
  end if;

  -- Ensure uniqueness
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  insert into public.profiles (id, username, display_name, current_skin_id)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', final_username),
    default_skin_id
  );

  -- Unlock default skin for the user
  if default_skin_id is not null then
    insert into public.user_skins (user_id, skin_id) values (new.id, default_skin_id);
  end if;

  -- Create initial free subscription
  insert into public.subscriptions (user_id, tier, status, platform)
  values (new.id, 'free', 'active', 'web');

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
