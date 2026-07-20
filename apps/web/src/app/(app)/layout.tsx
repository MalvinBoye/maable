import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MaableNav } from '@/components/app/maable-nav'
import { ChibiPet } from '@/components/app/chibi-pet'
import { SkinProvider } from '@/components/app/skin-provider'
import { AppProviders } from '@/components/app/app-providers'
import type { Profile } from '@maable/core'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: profileData }, { count: notifCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    (supabase as any).from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
  ])

  const profile = profileData as Profile | null

  // Redirect new users to onboarding — the onboarding page lives outside (app) so this always fires
  if (!profile?.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <AppProviders>
      <SkinProvider slug={profile?.current_skin_id} />
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: 'var(--paper, #ffffff)' }}>
        <MaableNav profile={profile} notificationCount={notifCount ?? 0} />
        <main className="flex-1">
          {children}
        </main>
        <ChibiPet username={profile?.display_name ?? 'User'} />
      </div>
    </AppProviders>
  )
}
