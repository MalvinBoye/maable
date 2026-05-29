-- ─── Profile Pins (mood board) ───────────────────────────────────────────────

create table if not exists public.profile_pins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  image_url   text not null,
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_profile_pins_user_id on public.profile_pins(user_id);

alter table public.profile_pins enable row level security;

create policy "Users manage own pins" on public.profile_pins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Pins storage bucket ──────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pins', 'pins', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Public pins read"
  on storage.objects for select
  using (bucket_id = 'pins');

create policy "Users upload own pins"
  on storage.objects for insert
  with check (
    bucket_id = 'pins'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own pins"
  on storage.objects for delete
  using (
    bucket_id = 'pins'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
