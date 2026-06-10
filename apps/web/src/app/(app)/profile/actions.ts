'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function updateProfile(data: {
  display_name: string
  bio: string | null
  avatar_url: string | null
  username?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!data.display_name.trim()) return { error: 'Display name required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, unknown> = {
    display_name: data.display_name.trim(),
    bio:          data.bio?.trim() || null,
    avatar_url:   data.avatar_url || null,
  }

  if (data.username !== undefined) {
    const cleaned = data.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleaned.length < 3 || cleaned.length > 30) return { error: 'Username must be 3–30 characters' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('username', cleaned)
      .neq('id', user.id)
      .maybeSingle()
    if (existing) return { error: 'Username already taken' }
    update.username = cleaned
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('profiles').update(update).eq('id', user.id)

  revalidatePath('/profile')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function savePin(imageUrl: string, caption: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profile_pins')
    .insert({ user_id: user.id, image_url: imageUrl, caption: caption ?? null, sort_order: Math.floor(Date.now() / 1000) })

  revalidatePath('/profile')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function deletePin(pinId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pin } = await (supabase as any)
    .from('profile_pins')
    .select('image_url')
    .eq('id', pinId)
    .eq('user_id', user.id)
    .single()

  if (pin?.image_url) {
    const url = pin.image_url as string
    const match = url.match(/\/storage\/v1\/object\/public\/pins\/(.+)/)
    if (match?.[1]) {
      await supabase.storage.from('pins').remove([decodeURIComponent(match[1])])
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('profile_pins').delete().eq('id', pinId).eq('user_id', user.id)

  revalidatePath('/profile')
  return { error: null }
}
