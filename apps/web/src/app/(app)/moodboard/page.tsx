import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@maable/core'
import { MoodBoardClient } from './moodboard-client'

export interface MoodPin {
  id: string
  image_url: string
  caption: string | null
  sort_order: number
  created_at: string
}

export interface MoodTask {
  id: string
  title: string
  priority: string
  status: string
  due_date: string | null
}

export interface MoodHabit {
  id: string
  title: string
  current_streak: number
  frequency: string
}

export interface MoodStats {
  level: number
  levelXp: number
  totalXp: number
  streakDays: number
  streakActive: boolean
  tasksCompleted: number
  weeklyScore: number
}

export default async function MoodBoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = supabase as any
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: profile }, { data: pins }, { data: tasks }, { data: habits }, { data: completedTasks }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      s.from('profile_pins').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }).limit(30),
      s.from('tasks').select('id, title, priority, status, due_date').eq('user_id', user.id).in('status', ['todo', 'in_progress']).order('sort_order', { ascending: true }).limit(16),
      s.from('habits').select('id, title, current_streak, frequency').eq('user_id', user.id).eq('is_archived', false).order('sort_order', { ascending: true }).limit(10),
      supabase.from('tasks').select('id').eq('user_id', user.id).eq('status', 'done').gte('completed_at', weekAgo),
    ])

  const p = profile as Profile | null
  const totalXp = p?.total_xp ?? 0
  const level = Math.floor(totalXp / 1000) + 1
  const levelXp = totalXp % 1000
  const allHabits = (habits ?? []) as MoodHabit[]
  const maxStreak = allHabits.reduce((m, h) => Math.max(m, h.current_streak), 0)
  const streakActive = allHabits.some(h => h.current_streak > 0)
  const completedThisWeek = (completedTasks ?? []).length

  const stats: MoodStats = {
    level,
    levelXp,
    totalXp,
    streakDays: maxStreak,
    streakActive,
    tasksCompleted: completedThisWeek,
    weeklyScore: completedThisWeek * 25,
  }

  return (
    <MoodBoardClient
      userId={user.id}
      profile={p}
      pins={(pins ?? []) as MoodPin[]}
      tasks={(tasks ?? []) as MoodTask[]}
      habits={allHabits}
      stats={stats}
    />
  )
}
