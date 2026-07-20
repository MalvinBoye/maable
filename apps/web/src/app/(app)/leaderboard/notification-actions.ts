'use server'

import { createClient } from '@/lib/supabase/server'

export interface AppNotification {
  id: string
  type: 'friend_request' | 'friend_accepted'
  from_user_id: string
  from_display_name: string
  from_username: string
  from_avatar_url: string | null
  read: boolean
  created_at: string
}

export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('notifications')
    .select('id, type, from_user_id, read, created_at, profiles!notifications_from_user_id_fkey(display_name, username, avatar_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    from_user_id: n.from_user_id,
    from_display_name: n.profiles?.display_name ?? 'Someone',
    from_username: n.profiles?.username ?? '',
    from_avatar_url: n.profiles?.avatar_url ?? null,
    read: n.read,
    created_at: n.created_at,
  }))
}

export async function markNotificationsRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return count ?? 0
}
