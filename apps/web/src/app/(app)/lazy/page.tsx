import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Task } from '@maable/core'
import { LazyClient } from './lazy-client'

export default async function LazyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = supabase as any

  const { data: tasks } = await s
    .from('tasks')
    .select('id, title, priority, due_date, status, tags, sort_order')
    .eq('user_id', user.id)
    .in('status', ['todo', 'in_progress'])
    .order('sort_order', { ascending: true })

  return <LazyClient tasks={(tasks ?? []) as Task[]} />
}
