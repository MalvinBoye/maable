import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Task } from '@maable/core'
import { CategoryClient } from '@/app/(app)/_category/category-client'

export default async function CareerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data }, { data: profile }] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'archived').contains('tags', ['career']).order('sort_order', { ascending: true }),
    (supabase as any).from('profiles').select('level, total_xp').eq('id', user.id).single(),
  ])
  const p = profile as { level: number; total_xp: number } | null

  return (
    <CategoryClient
      tasks={(data ?? []) as Task[]}
      xpData={p ? { level: p.level, xp: p.total_xp } : null}
      config={{
        tag: 'career',
        title: 'Career',
        tagline: 'Build the life you want.',
        illustration: 'career',
        taskLabel: 'goal',
        emptyLine1: 'No career goals yet',
        emptyLine2: 'Add your first goal and start climbing.',

        integrationId: 'linkedin',
        integrationName: 'LinkedIn',
        integrationColor: '#0077b5',
        integrationHint: 'Connect LinkedIn to import your skills and generate interview prep cards.',
        quickLinks: [
          { label: 'Career notes',        href: '/notes',   icon: '✦' },
          { label: 'Interview prep cards', href: '/notes',   icon: '◎' },
          { label: 'GitHub + more',       href: '/connect', icon: '◈' },
          { label: 'Weekly plan',         href: '/schedule', icon: '◫' },
        ],
        tips: [
          'Log each job application as a goal with a due date.',
          'Use STAR format in career notes for interview prep.',
          'Mark completed interviews done to track your pipeline.',
          'Connect GitHub to auto-log your coding streak as a habit.',
          'Generate flashcards from career notes to nail interviews.',
        ],
      }}
    />
  )
}
