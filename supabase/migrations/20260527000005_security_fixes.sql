-- Security fix: game_rooms SELECT policy was too permissive.
-- The old policy allowed ANY authenticated user to view rooms where guest_id IS NULL,
-- leaking metadata for all pending games. Only the host or accepted guest should see a room.

drop policy if exists "Players can view rooms they're in" on game_rooms;

create policy "Players can view rooms they're in"
  on game_rooms for select
  using (auth.uid() = host_id or auth.uid() = guest_id);

-- Security fix: add HSTS and additional hardening via RLS comment
-- (CSP / HSTS handled in next.config.ts, this migration covers DB-level fixes)

-- Ensure user_integrations updated_at trigger exists idempotently
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
