-- Vision board: free-form pinboard, one per user
create table board_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  type       text not null check (type in ('photo', 'note')),
  content    text,           -- image URL for photo, text for note
  caption    text,
  x          float not null default 100,
  y          float not null default 100,
  rotation   float not null default 0,
  width      float not null default 200,
  color      text not null default '#fdf9f0',  -- note background
  z_order    int  not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index board_items_user on board_items (user_id);

alter table board_items enable row level security;

create policy "Users manage own board items"
  on board_items for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger board_items_updated_at
  before update on board_items
  for each row execute function update_updated_at_column();

-- Storage bucket for board photos
insert into storage.buckets (id, name, public)
values ('board', 'board', true)
on conflict (id) do nothing;

create policy "Users upload board photos"
  on storage.objects for insert
  with check (bucket_id = 'board' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read board photos"
  on storage.objects for select
  using (bucket_id = 'board');

create policy "Users delete own board photos"
  on storage.objects for delete
  using (bucket_id = 'board' and auth.uid()::text = (storage.foldername(name))[1]);
