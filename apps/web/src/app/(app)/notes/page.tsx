import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Note } from '@maable/core'
import { NotesClient } from './notes-client'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  return <NotesClient notes={(data ?? []) as Note[]} />
}
