import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Habit, HabitCompletion } from '@maable/core'
import { HabitsClient } from './habits-client'

export default async function HabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Last 7 days window (today inclusive)
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  const fromDate = sevenDaysAgo.toISOString().slice(0, 10)
  const toDate = today.toISOString().slice(0, 10)

  const [{ data: habits }, { data: completions }] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true }),
    supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_date', fromDate)
      .lte('completed_date', toDate),
  ])

  return (
    <HabitsClient
      habits={(habits ?? []) as Habit[]}
      completions={(completions ?? []) as HabitCompletion[]}
      today={toDate}
    />
  )
}
