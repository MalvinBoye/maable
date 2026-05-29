-- Journal entries: one per day per user
create table journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  entry_date  date not null,
  mood        smallint check (mood between 1 and 5),
  prompt      text,
  content     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, entry_date)
);

create index journal_entries_user_date on journal_entries (user_id, entry_date desc);

alter table journal_entries enable row level security;

create policy "Users manage own journal entries"
  on journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger journal_entries_updated_at
  before update on journal_entries
  for each row execute function update_updated_at_column();

-- Game rooms: Supabase Realtime channels handle state;
-- this table tracks room metadata + final results only
create table game_rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,           -- 4-letter room code
  game        text not null default 'ttt',    -- 'ttt' | future games
  host_id     uuid references auth.users not null,
  guest_id    uuid references auth.users,
  state       jsonb default '{}',             -- current game state
  winner      text,                           -- 'X' | 'O' | 'draw' | null
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index game_rooms_code on game_rooms (code);
create index game_rooms_host on game_rooms (host_id);

alter table game_rooms enable row level security;

create policy "Players can view rooms they're in"
  on game_rooms for select
  using (auth.uid() = host_id or auth.uid() = guest_id or guest_id is null);

create policy "Host can create rooms"
  on game_rooms for insert
  with check (auth.uid() = host_id);

create policy "Players can update rooms"
  on game_rooms for update
  using (auth.uid() = host_id or auth.uid() = guest_id);

create trigger game_rooms_updated_at
  before update on game_rooms
  for each row execute function update_updated_at_column();
