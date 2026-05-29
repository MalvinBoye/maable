import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, XpTransaction } from '@maable/core'
import { ProfileClient } from './profile-client'

export interface ProfilePin {
  id: string
  image_url: string
  caption: string | null
  sort_order: number
  created_at: string
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: recentXp }, { data: tasksDone }, { data: habitsDone }, { data: pins }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('xp_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'done'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('habit_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('profile_pins')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .limit(20),
    ])

  return (
    <ProfileClient
      profile={profile as unknown as Profile}
      recentXp={(recentXp ?? []) as XpTransaction[]}
      tasksDoneCount={(tasksDone as unknown as { count: number })?.count ?? 0}
      habitsDoneCount={(habitsDone as unknown as { count: number })?.count ?? 0}
      pins={(pins ?? []) as ProfilePin[]}
    />
  )
}
