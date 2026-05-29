'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function toTiptapJson(text: string) {
  const paragraphs = text.split('\n').map((line) => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : [],
  }))
  return { type: 'doc', content: paragraphs }
}

export async function createNote(data: { title: string; body: string; tags?: string[] }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', id: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: note, error } = await (supabase as any)
    .from('notes')
    .insert({
      user_id:      user.id,
      title:        data.title.trim() || 'Untitled',
      content:      toTiptapJson(data.body),
      content_text: data.body,
      tags:         data.tags ?? [],
      is_pinned:    false,
      is_archived:  false,
    })
    .select('id')
    .single()

  revalidatePath('/notes')
  return {
    error: (error as { message?: string } | null)?.message ?? null,
    id: (note as { id: string } | null)?.id ?? null,
  }
}

export async function updateNote(id: string, data: { title: string; body: string; tags?: string[] }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notes')
    .update({
      title:        data.title.trim() || 'Untitled',
      content:      toTiptapJson(data.body),
      content_text: data.body,
      ...(data.tags !== undefined && { tags: data.tags }),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/notes')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function togglePin(id: string, current: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notes')
    .update({ is_pinned: !current })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/notes')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notes')
    .update({ is_archived: true })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/notes')
  return { error: (error as { message?: string } | null)?.message ?? null }
}
