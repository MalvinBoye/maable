import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { JournalEntry } from '@maable/core'
import { JournalClient } from './journal-client'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch last 90 days of entries for the calendar + recent entries list
  const since = new Date()
  since.setDate(since.getDate() - 90)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('entry_date', since.toISOString().slice(0, 10))
    .order('entry_date', { ascending: false })

  return <JournalClient entries={(data ?? []) as JournalEntry[]} />
}
