'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface BoardItemData {
  id: string
  type: 'photo' | 'note'
  content: string | null
  caption: string | null
  x: number
  y: number
  rotation: number
  width: number
  color: string
  z_order: number
  created_at: string
}

export async function getBoardItems(): Promise<BoardItemData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('board_items')
    .select('*')
    .eq('user_id', user.id)
    .order('z_order', { ascending: true })

  return (data ?? []) as BoardItemData[]
}

export async function createBoardItem(item: {
  type: 'photo' | 'note'
  content: string | null
  caption?: string | null
  x: number
  y: number
  rotation: number
  width: number
  color: string
  z_order: number
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { id: null, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('board_items')
    .insert({ user_id: user.id, ...item })
    .select('id')
    .single()

  revalidatePath('/board')
  return {
    id: (data as { id: string } | null)?.id ?? null,
    error: (error as { message?: string } | null)?.message ?? null,
  }
}

export async function updateBoardItem(id: string, updates: Partial<{
  content: string | null
  caption: string | null
  x: number
  y: number
  rotation: number
  width: number
  color: string
  z_order: number
}>): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('board_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function deleteBoardItem(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('board_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/board')
  return { error: (error as { message?: string } | null)?.message ?? null }
}
