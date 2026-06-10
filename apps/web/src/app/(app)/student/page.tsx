import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Task } from '@maable/core'
import { CategoryClient } from '@/app/(app)/_category/category-client'

export default async function StudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data }, { data: profile }] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'archived').contains('tags', ['student']).order('due_date', { ascending: true, nullsFirst: false }),
    (supabase as any).from('profiles').select('level, total_xp').eq('id', user.id).single(),
  ])
  const p = profile as { level: number; total_xp: number } | null

  return (
    <CategoryClient
      tasks={(data ?? []) as Task[]}
      xpData={p ? { level: p.level, xp: p.total_xp } : null}
      config={{
        tag: 'student',
        title: 'Student',
        tagline: 'Deadlines wait for no one.',
        illustration: 'student',
        taskLabel: 'assignment',
        emptyLine1: 'No assignments yet',
        emptyLine2: 'Add something before the deadline creeps up.',

        integrationId: 'canvas',
        integrationName: 'Canvas',
        integrationColor: '#e66000',
        integrationHint: 'Connect Canvas to auto-import your assignments and due dates.',
        quickLinks: [
          { label: 'Notes',      href: '/notes',    icon: '✦', description: 'Lecture & study notes' },
          { label: 'Flashcards', href: '/notes',    icon: '◎', description: 'Revise with spaced rep' },
          { label: 'Schedule',   href: '/schedule', icon: '◫', description: 'Map out your deadlines' },
          { label: 'Habits',     href: '/habits',   icon: '⊕', description: 'Study streaks & routines' },
        ],
        tips: [
          'Use urgent priority for anything due this week.',
          'Tag assignments by subject to filter by course.',
          'Connect Canvas to skip manual entry.',
          'Turn lecture notes into flashcards from the Notes page.',
        ],
      }}
    />
  )
}
