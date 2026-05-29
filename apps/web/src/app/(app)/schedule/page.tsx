import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Task, Habit } from '@maable/core'
import { ScheduleClient } from './schedule-client'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = supabase as any

  const [{ data: tasks }, { data: habits }] = await Promise.all([
    s.from('tasks')
      .select('id, title, priority, due_date, status, tags')
      .eq('user_id', user.id)
      .in('status', ['todo', 'in_progress'])
      .order('sort_order', { ascending: true }),
    s.from('habits')
      .select('id, title, color, icon, frequency, frequency_days')
      .eq('user_id', user.id)
      .eq('is_archived', false),
  ])

  return (
    <ScheduleClient
      tasks={(tasks ?? []) as Task[]}
      habits={(habits ?? []) as Habit[]}
    />
  )
}
