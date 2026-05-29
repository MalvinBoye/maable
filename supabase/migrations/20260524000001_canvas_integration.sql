-- ============================================================
-- Canvas integration: OAuth state storage
-- ============================================================
-- Encryption is handled in app code (AES-256-GCM via Node/Deno crypto)
-- using TOKEN_ENCRYPTION_KEY env var. No pgcrypto SQL functions needed.

-- Temporary state store for OAuth flows.
-- canvas_url is stored here during the authorize step so the callback can retrieve it.
create table if not exists public.oauth_states (
  id           text primary key,                    -- random UUID used as `state` param
  user_id      uuid not null references public.profiles(id) on delete cascade,
  provider     text not null,
  metadata     jsonb not null default '{}',         -- stores canvas_url, redirect_to, etc.
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists idx_oauth_states_user_id  on public.oauth_states(user_id);
create index if not exists idx_oauth_states_expires  on public.oauth_states(expires_at);

-- RLS: users can only see their own states
alter table public.oauth_states enable row level security;

create policy "oauth_states_own"
  on public.oauth_states for all
  using (auth.uid() = user_id);

-- Auto-purge expired states (runs via pg_cron if available, otherwise harmless)
create or replace function public.purge_expired_oauth_states()
returns void language sql security definer as $$
  delete from public.oauth_states where expires_at < now();
$$;
