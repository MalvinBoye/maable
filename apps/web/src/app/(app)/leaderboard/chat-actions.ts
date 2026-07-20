'use server'

import { createClient } from '@/lib/supabase/server'

export interface FriendInfo {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  unread_count: number
}

export interface ChatMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read: boolean
  created_at: string
}

export async function getFriends(): Promise<FriendInfo[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: friendships } = await (supabase as any)
    .from('friendships')
    .select(`
      requester_id, addressee_id,
      requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url),
      addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (!friendships?.length) return []

  // Get unread message counts per friend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unreadRows } = await (supabase as any)
    .from('messages')
    .select('sender_id')
    .eq('recipient_id', user.id)
    .eq('read', false)

  const unreadCounts: Record<string, number> = {}
  for (const row of unreadRows ?? []) {
    unreadCounts[row.sender_id] = (unreadCounts[row.sender_id] ?? 0) + 1
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (friendships as any[]).map(f => {
    const friend = f.requester_id === user.id ? f.addressee : f.requester
    return {
      id: friend.id,
      username: friend.username,
      display_name: friend.display_name,
      avatar_url: friend.avatar_url,
      unread_count: unreadCounts[friend.id] ?? 0,
    }
  })
}

export async function getMessages(friendId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch messages between me and friend using simple .in() filters.
  // Because sender != recipient (DB constraint), this returns only our conversation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('messages')
    .select('*')
    .in('sender_id', [user.id, friendId])
    .in('recipient_id', [user.id, friendId])
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return []
  return data ?? []
}

export async function sendMessage(
  recipientId: string,
  content: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Empty message' }
  if (trimmed.length > 2000) return { error: 'Message too long' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('messages')
    .insert({ sender_id: user.id, recipient_id: recipientId, content: trimmed })

  return { error: error ? 'Failed to send' : null }
}

export async function markMessagesRead(friendId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('messages')
    .update({ read: true })
    .eq('recipient_id', user.id)
    .eq('sender_id', friendId)
    .eq('read', false)
}
