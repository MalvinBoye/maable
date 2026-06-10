'use server'

import { createClient } from '@/lib/supabase/server'
import { detectIntent } from '@/lib/chibi/intent'
import { generateResponse } from '@/lib/chibi/respond'
import type { ChibiResponse, UserContext } from '@/lib/chibi/types'

export type ChibiMood = 'ecstatic' | 'happy' | 'calm' | 'worried' | 'sad' | 'mad'

export interface ChibiStatus {
  mood: ChibiMood
  overdueCount: number
  completedToday: number
  maxStreak: number
  reminders: string[]
}

export async function getChibiStatus(): Promise<ChibiStatus> {
  const fallback: ChibiStatus = { mood: 'calm', overdueCount: 0, completedToday: 0, maxStreak: 0, reminders: [] }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fallback

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = supabase as any
    const todayDate = new Date().toISOString().split('T')[0]!
    const todayStart = `${todayDate}T00:00:00`

    const [{ data: overdue }, { data: doneToday }, { data: habits }] = await Promise.all([
      s.from('tasks').select('id, title, priority')
        .eq('user_id', user.id).neq('status', 'done').neq('status', 'archived')
        .not('due_date', 'is', null).lt('due_date', todayDate),
      s.from('tasks').select('id')
        .eq('user_id', user.id).eq('status', 'done')
        .gte('updated_at', todayStart),
      s.from('habits').select('title, current_streak')
        .eq('user_id', user.id).eq('is_archived', false),
    ])

    const overdueCount   = (overdue   ?? []).length
    const completedToday = (doneToday ?? []).length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maxStreak = Math.max(0, ...((habits ?? []) as any[]).map((h) => h.current_streak ?? 0))

    const reminders: string[] = []
    let mood: ChibiMood = 'calm'

    if (overdueCount >= 3) {
      mood = 'mad'
      reminders.push(`${overdueCount} tasks overdue. You said you'd do these.`)
    } else if (overdueCount >= 1 && completedToday === 0) {
      mood = 'sad'
      reminders.push(`${overdueCount} task${overdueCount > 1 ? 's' : ''} overdue and nothing done yet.`)
    } else if (completedToday >= 5) {
      mood = 'ecstatic'
      reminders.push(`${completedToday} tasks done today — you're on fire!`)
    } else if (completedToday >= 2 && overdueCount === 0) {
      mood = 'happy'
      if (maxStreak >= 3) reminders.push(`${maxStreak}-day streak going strong 🔥`)
    } else if (overdueCount === 1) {
      mood = 'worried'
      reminders.push(`One task is overdue. Deal with it before it piles up.`)
    } else {
      if (maxStreak >= 5) reminders.push(`${maxStreak}-day streak! Keep it up.`)
    }

    return { mood, overdueCount, completedToday, maxStreak, reminders }
  } catch {
    return fallback
  }
}

// Simple in-memory rate limit: max 20 requests per user per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function askChibi(message: string): Promise<ChibiResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { text: "You're not logged in — something's gone wrong." }

    // Rate limit check
    const now = Date.now()
    const key = user.id
    const entry = rateLimitMap.get(key)
    if (entry && now < entry.resetAt) {
      if (entry.count >= 20) {
        return { text: "Slow down — you're sending a lot of messages. Give it a minute." }
      }
      entry.count++
    } else {
      rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 })
    }

    // Fetch user context in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = supabase as any
    const [{ data: profile }, { data: tasks }, { data: habits }, { data: notes }] = await Promise.all([
      s.from('profiles').select('display_name, level, total_xp').eq('id', user.id).single(),
      s.from('tasks').select('id, title, status, priority, due_date').eq('user_id', user.id).neq('status', 'archived').limit(50),
      s.from('habits').select('id, title, current_streak').eq('user_id', user.id).eq('is_archived', false).limit(20),
      s.from('notes').select('id, title, content_text, tags').eq('user_id', user.id).eq('is_archived', false).limit(30),
    ])

    const ctx: UserContext = {
      name:   profile?.display_name ?? 'User',
      level:  profile?.level ?? 1,
      xp:     profile?.total_xp ?? 0,
      tasks:  tasks ?? [],
      habits: habits ?? [],
      notes:  notes ?? [],
    }

    const intent = detectIntent(message)
    return generateResponse(intent, ctx)
  } catch {
    return { text: "Something went wrong on my end. Try again in a moment." }
  }
}
