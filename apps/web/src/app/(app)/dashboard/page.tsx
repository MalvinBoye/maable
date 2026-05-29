import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, Habit } from '@maable/core'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [profileResult, completedTasksResult, habitsResult, urgentTasksResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('completed_at', weekAgo),
    supabase.from('habits').select('*').eq('user_id', user.id).eq('is_archived', false),
    supabase
      .from('tasks')
      .select('id, title, priority, due_date')
      .eq('user_id', user.id)
      .in('priority', ['urgent', 'high'])
      .in('status', ['todo', 'in_progress'])
      .order('priority', { ascending: false })
      .limit(4),
  ])

  const profile = profileResult.data as Profile | null
  const habits = habitsResult.data as Habit[] | null
  const completedThisWeek = completedTasksResult.data?.length ?? 0
  const maxStreak = habits?.reduce((max, h) => Math.max(max, h.current_streak), 0) ?? 0
  const streakActive = habits?.some((h) => h.current_streak > 0) ?? false
  const totalXp = profile?.total_xp ?? 0
  const urgentTasks = (urgentTasksResult.data ?? []) as Array<{
    id: string
    title: string
    priority: string
    due_date: string | null
  }>

  const level = Math.floor(totalXp / 1000) + 1
  const xpInLevel = totalXp % 1000

  return (
    <DashboardClient
      profile={profile}
      urgentTasks={urgentTasks}
      stats={{
        weeklyScore:    completedThisWeek * 25,
        tasksCompleted: completedThisWeek,
        streakDays:     maxStreak,
        streakActive,
        levelXp:        xpInLevel,
        level,
        totalXp,
      }}
    />
  )
}
