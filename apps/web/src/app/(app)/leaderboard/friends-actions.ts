'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface FriendRequest {
  id: string
  requester_id: string
  display_name: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface UserSearchResult {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  level: number
  total_xp: number
  friendship_status: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  if (!query.trim() || query.length < 2) return []
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('id, username, display_name, avatar_url, level, total_xp')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('id', user.id)
    .limit(8)

  if (!profiles || profiles.length === 0) return []

  // Get existing friendships involving current user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: friendships } = await (supabase as any)
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const fsMap = new Map<string, { status: string; isRequester: boolean }>()
  for (const f of friendships ?? []) {
    const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
    fsMap.set(otherId, { status: f.status, isRequester: f.requester_id === user.id })
  }

  return profiles.map((p: { id: string; username: string; display_name: string; avatar_url: string | null; level: number; total_xp: number }) => {
    const fs = fsMap.get(p.id)
    let friendship_status: UserSearchResult['friendship_status'] = 'none'
    if (fs) {
      if (fs.status === 'accepted') friendship_status = 'accepted'
      else if (fs.status === 'pending') friendship_status = fs.isRequester ? 'pending_sent' : 'pending_received'
    }
    return { ...p, friendship_status }
  })
}

export async function sendFriendRequest(addresseeId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (addresseeId === user.id) return { error: 'Cannot add yourself' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: addresseeId, status: 'pending' })

  if (error) return { error: 'Could not send request' }
  revalidatePath('/leaderboard')
  return { error: null }
}

export async function respondToFriendRequest(
  requesterId: string,
  action: 'accept' | 'decline'
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (action === 'accept') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('requester_id', requesterId)
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
    if (error) return { error: 'Could not accept request' }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('friendships')
      .delete()
      .eq('requester_id', requesterId)
      .eq('addressee_id', user.id)
    if (error) return { error: 'Could not decline request' }
  }

  revalidatePath('/leaderboard')
  return { error: null }
}

export async function getPendingRequestCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  return count ?? 0
}

export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('friendships')
    .select('id, requester_id, created_at, profiles!friendships_requester_id_fkey(display_name, username, avatar_url)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (data ?? []).map((r: {
    id: string
    requester_id: string
    created_at: string
    profiles: { display_name: string; username: string; avatar_url: string | null }
  }) => ({
    id: r.id,
    requester_id: r.requester_id,
    display_name: r.profiles.display_name,
    username: r.profiles.username,
    avatar_url: r.profiles.avatar_url,
    created_at: r.created_at,
  }))
}
