import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { LeaderboardEntry } from '@maable/core'
import { LeaderboardClient } from './leaderboard-client'
import { getIncomingRequests } from './friends-actions'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: global }, { data: friends }, incomingRequests] = await Promise.all([
    (supabase as any).from('leaderboard_global').select('*').order('rank', { ascending: true }).limit(50),
    (supabase as any).from('leaderboard_friends').select('*').eq('viewer_user_id', user.id).order('rank', { ascending: true }).limit(50),
    getIncomingRequests(),
  ])

  return (
    <LeaderboardClient
      global={(global ?? []) as LeaderboardEntry[]}
      friends={(friends ?? []) as LeaderboardEntry[]}
      currentUserId={user.id}
      incomingRequests={incomingRequests}
    />
  )
}
