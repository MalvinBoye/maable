-- user_integrations: stores OAuth tokens for third-party services (Spotify, etc.)
-- Separate from the `integrations` table which uses encrypted PATs for Canvas.
-- These are lightweight short-lived tokens that rotate automatically.

create table if not exists public.user_integrations (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  provider      text        not null,
  access_token  text        not null,
  refresh_token text,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, provider)
);

alter table public.user_integrations enable row level security;

create policy "users manage own oauth integrations"
  on public.user_integrations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_integrations_updated_at
  before update on public.user_integrations
  for each row execute procedure public.set_updated_at();
