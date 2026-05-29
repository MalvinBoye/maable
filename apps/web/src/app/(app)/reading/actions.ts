'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type BookStatus = 'reading' | 'want' | 'finished'

export interface BookData {
  title: string
  author: string
  status: BookStatus
  progress: number // 0–100
  total_pages: number | null
  cover_color: string
}

function encodeBook(data: BookData) {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: JSON.stringify(data) }] }],
  }
}

export async function createBook(data: BookData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', id: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: note, error } = await (supabase as any)
    .from('notes')
    .insert({
      user_id:      user.id,
      title:        data.title,
      content:      encodeBook(data),
      content_text: data.author,
      tags:         ['__book__'],
      is_pinned:    false,
      is_archived:  false,
    })
    .select('id')
    .single()

  revalidatePath('/reading')
  return {
    error: (error as { message?: string } | null)?.message ?? null,
    id: (note as { id: string } | null)?.id ?? null,
  }
}

export async function updateBook(id: string, data: Partial<BookData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('notes')
    .select('content')
    .eq('id', id)
    .single()

  const current = (() => {
    try {
      const doc = (existing as { content: { content: Array<{ content: Array<{ text: string }> }> } }).content
      return JSON.parse(doc.content[0]?.content[0]?.text ?? '{}') as BookData
    } catch { return {} as BookData }
  })()

  const merged: BookData = { ...current, ...data }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notes')
    .update({
      title:        merged.title ?? current.title,
      content:      encodeBook(merged),
      content_text: merged.author ?? current.author,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/reading')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function deleteBook(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notes')
    .update({ is_archived: true })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/reading')
  return { error: (error as { message?: string } | null)?.message ?? null }
}
