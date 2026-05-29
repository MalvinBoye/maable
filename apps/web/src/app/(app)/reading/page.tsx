import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReadingClient, type Book } from './reading-client'

function parseBook(note: {
  id: string
  title: string
  content: unknown
  content_text: string | null
  updated_at: string
}): Book {
  try {
    const doc = note.content as { content: Array<{ content: Array<{ text: string }> }> }
    const data = JSON.parse(doc.content[0]?.content[0]?.text ?? '{}')
    return {
      id: note.id,
      title: note.title,
      author: note.content_text ?? '',
      status: data.status ?? 'want',
      progress: data.progress ?? 0,
      total_pages: data.total_pages ?? null,
      cover_color: data.cover_color ?? '#1a1916',
      updated_at: note.updated_at,
    }
  } catch {
    return {
      id: note.id,
      title: note.title,
      author: note.content_text ?? '',
      status: 'want',
      progress: 0,
      total_pages: null,
      cover_color: '#1a1916',
      updated_at: note.updated_at,
    }
  }
}

export default async function ReadingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = supabase as any
  const [{ data }, { data: profile }] = await Promise.all([
    s.from('notes')
      .select('id, title, content, content_text, updated_at')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .contains('tags', ['__book__'])
      .order('updated_at', { ascending: false }),
    s.from('profiles').select('level, total_xp').eq('id', user.id).single(),
  ])

  const books = ((data ?? []) as Array<{
    id: string; title: string; content: unknown; content_text: string | null; updated_at: string
  }>).map(parseBook)
  const p = profile as { level: number; total_xp: number } | null

  return <ReadingClient books={books} xpData={p ? { level: p.level, xp: p.total_xp } : null} />
}
