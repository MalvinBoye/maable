'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { HabitFrequency } from '@maable/core'
import { getPostHogClient } from '@/lib/posthog'

export async function logCompletion(habitId: string, date: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('habit_completions')
    .select('id, count')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .eq('completed_date', date)
    .maybeSingle()

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('habit_completions')
      .update({ count: (existing.count as number) + 1 })
      .eq('id', existing.id)
    if (error) return { error: (error as { message?: string }).message ?? null }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('habit_completions')
      .insert({ habit_id: habitId, user_id: user.id, completed_date: date, count: 1, note: null })
    if (error) return { error: (error as { message?: string }).message ?? null }
  }

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: user.id,
    event: 'habit_completed',
    properties: { habit_id: habitId, date },
  })
  await posthog.flush()

  // Award XP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: habit } = await (supabase as any)
    .from('habits')
    .select('xp_reward')
    .eq('id', habitId)
    .single()

  if (habit) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('total_xp')
      .eq('id', user.id)
      .single()

    if (profile) {
      const newXp = (profile.total_xp as number) + (habit.xp_reward as number)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ total_xp: newXp, level: Math.floor(newXp / 1000) + 1 })
        .eq('id', user.id)
    }
  }

  revalidatePath('/habits')
  revalidatePath('/leaderboard')
  return { error: null }
}

export async function removeCompletion(habitId: string, date: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('habit_completions')
    .select('id, count')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .eq('completed_date', date)
    .maybeSingle()

  if (!existing) return { error: null }

  if ((existing.count as number) > 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('habit_completions')
      .update({ count: (existing.count as number) - 1 })
      .eq('id', existing.id)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('habit_completions').delete().eq('id', existing.id)
  }

  revalidatePath('/habits')
  return { error: null }
}

export async function createHabit(data: {
  title: string
  frequency: HabitFrequency
  target_count: number
  color: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!data.title.trim()) return { error: 'Title required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('habits').insert({
    user_id: user.id,
    title: data.title.trim(),
    frequency: data.frequency,
    target_count: data.target_count,
    color: data.color,
    xp_reward: 20,
    current_streak: 0,
    longest_streak: 0,
    is_archived: false,
    sort_order: Math.floor(Date.now() / 1000),
  })

  if (!error) {
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: user.id,
      event: 'habit_created',
      properties: {
        title: data.title.trim(),
        frequency: data.frequency,
        target_count: data.target_count,
      },
    })
    await posthog.flush()
  }

  revalidatePath('/habits')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function archiveHabit(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('habits')
    .update({ is_archived: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (!error) {
    const posthog = getPostHogClient()
    posthog.capture({ distinctId: user.id, event: 'habit_archived', properties: { habit_id: id } })
    await posthog.flush()
  }

  revalidatePath('/habits')
  return { error: (error as { message?: string } | null)?.message ?? null }
}
