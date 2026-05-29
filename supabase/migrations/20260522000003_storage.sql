-- ─── Storage Buckets ──────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('note-attachments', 'note-attachments', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  ('skins', 'skins', true, 20971520, array['image/jpeg', 'image/png', 'image/webp']);

-- ─── Storage RLS ──────────────────────────────────────────────────────────────

-- Avatars: public read, own write
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_own_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name like auth.uid()::text || '/%'
  );

create policy "avatars_own_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_own_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Note attachments: private, own only
create policy "note_attachments_own_read"
  on storage.objects for select
  using (bucket_id = 'note-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "note_attachments_own_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'note-attachments'
    and auth.uid() is not null
    and name like auth.uid()::text || '/%'
  );

create policy "note_attachments_own_delete"
  on storage.objects for delete
  using (bucket_id = 'note-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

-- Skins: public read only (admins upload via service role)
create policy "skins_public_read"
  on storage.objects for select
  using (bucket_id = 'skins');
