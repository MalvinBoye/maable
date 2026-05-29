import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('onboarding_complete, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_complete) redirect('/dashboard')

  const params = await searchParams
  const defaultName = (profile?.display_name as string | null) ?? user.email?.split('@')[0] ?? ''

  return <OnboardingForm defaultName={defaultName} error={params.error ?? null} />
}
