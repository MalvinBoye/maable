'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getPostHogClient } from '@/lib/posthog'

export async function upsertJournalEntry(data: {
  entry_date: string
  content: string
  mood: number | null
  prompt: string | null
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('journal_entries').upsert(
    {
      user_id: user.id,
      entry_date: data.entry_date,
      content: data.content,
      mood: data.mood,
      prompt: data.prompt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,entry_date' }
  )

  if (!error) {
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: user.id,
      event: 'journal_entry_saved',
      properties: {
        entry_date: data.entry_date,
        has_mood: data.mood !== null,
        has_prompt: data.prompt !== null,
      },
    })
    await posthog.flush()
  }

  revalidatePath('/journal')
  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function deleteJournalEntry(entry_date: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('journal_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('entry_date', entry_date)

  revalidatePath('/journal')
  return { error: (error as { message?: string } | null)?.message ?? null }
}
