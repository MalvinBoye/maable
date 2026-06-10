'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TaskPriority, TaskStatus } from '@maable/core'

const XP_BY_PRIORITY: Record<TaskPriority, number> = {
  low: 10, medium: 25, high: 50, urgent: 75,
}

// Tag values that have a dedicated category page; used to revalidate those pages after task creation.
const CATEGORY_TAG_PATHS: Record<string, string> = {
  career:  '/career',
  hobbies: '/hobbies',
  student: '/student',
}

export async function createTask(data: {
  title: string
  priority: TaskPriority
  due_date: string | null
  due_time?: string | null
  repeat?: string | null
  tags?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!data.title.trim()) return { error: 'Title required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('tasks').insert({
    user_id:    user.id,
    title:      data.title.trim(),
    priority:   data.priority,
    due_date:   data.due_date,
    due_time:   data.due_time ?? null,
    status:     'todo' as TaskStatus,
    xp_reward:  XP_BY_PRIORITY[data.priority],
    sort_order: Math.floor(Date.now() / 1000),
    tags:       data.tags ?? [],
  })

  revalidatePath('/tasks')
  for (const tag of data.tags ?? []) {
    const path = CATEGORY_TAG_PATHS[tag]
    if (path) revalidatePath(path)
  }
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function toggleTask(id: string, currentStatus: TaskStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const newStatus: TaskStatus = currentStatus === 'done' ? 'todo' : 'done'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tasks')
    .update({
      status:       newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (!error && newStatus === 'done') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task } = await (supabase as any)
      .from('tasks')
      .select('xp_reward')
      .eq('id', id)
      .single()

    if (task) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single()

      if (profile) {
        const newXp = (profile.total_xp as number) + (task.xp_reward as number)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('profiles')
          .update({ total_xp: newXp, level: Math.floor(newXp / 1000) + 1 })
          .eq('id', user.id)
      }
    }
  }

  revalidatePath('/tasks')
  revalidatePath('/leaderboard')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function archiveTask(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tasks')
    .update({ status: 'archived' as TaskStatus })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/tasks')
  return { error: (error as { message?: string } | null)?.message ?? null }
}
