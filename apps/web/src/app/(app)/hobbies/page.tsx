import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Task } from '@maable/core'
import { CategoryClient } from '@/app/(app)/_category/category-client'

export default async function HobbiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data }, { data: profile }] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'archived').contains('tags', ['hobbies']).order('sort_order', { ascending: true }),
    (supabase as any).from('profiles').select('level, total_xp').eq('id', user.id).single(),
  ])
  const p = profile as { level: number; total_xp: number } | null

  return (
    <CategoryClient
      tasks={(data ?? []) as Task[]}
      xpData={p ? { level: p.level, xp: p.total_xp } : null}
      config={{
        tag: 'hobbies',
        title: 'Hobbies',
        tagline: 'Make time for what makes you, you.',
        illustration: 'hobbies',
        taskLabel: 'project',
        emptyLine1: 'Nothing here yet',
        emptyLine2: "What's something you've been meaning to try?",

        integrationId: 'strava',
        integrationName: 'Strava',
        integrationColor: '#fc4c02',
        integrationHint: 'Connect Strava, Spotify, or Goodreads to track hobbies automatically.',
        quickLinks: [
          { label: 'Hobby notes',     href: '/notes',   icon: '✦' },
          { label: 'All integrations', href: '/connect', icon: '◈' },
          { label: 'Habit tracker',   href: '/habits',  icon: '⊕' },
        ],
        tips: [
          'Add projects with deadlines to stay accountable.',
          'Connect Strava to turn workouts into automatic habits.',
          'Use hobby notes to log techniques, tips, and progress.',
          'Track skill milestones as completed goals.',
          'Connect Goodreads to turn book highlights into flashcards.',
        ],
      }}
    />
  )
}
