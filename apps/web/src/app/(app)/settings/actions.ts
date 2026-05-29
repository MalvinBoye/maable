'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateTimezone(timezone: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ timezone })
    .eq('id', user.id)

  revalidatePath('/settings')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function updateUsername(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!username.trim()) return { error: 'Username required' }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: 'Username must be 3–20 chars: lowercase, numbers, underscores only' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ username: username.trim() })
    .eq('id', user.id)

  revalidatePath('/settings')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function updateSkin(slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ current_skin_id: slug })
    .eq('id', user.id)

  revalidatePath('/', 'layout')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
