'use server'

import { createClient } from '@/lib/supabase/server'
import { detectIntent } from '@/lib/chibi/intent'
import { generateResponse } from '@/lib/chibi/respond'
import type { ChibiResponse, UserContext } from '@/lib/chibi/types'

// Simple in-memory rate limit: max 20 requests per user per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function askChibi(message: string): Promise<ChibiResponse> {
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
}
