import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Task } from '@maable/core'
import { TasksClient } from './tasks-client'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('sort_order', { ascending: true })

  return <TasksClient tasks={(data ?? []) as Task[]} />
}
