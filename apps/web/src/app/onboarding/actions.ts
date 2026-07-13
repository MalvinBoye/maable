'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPostHogClient } from '@/lib/posthog'

export async function completeOnboarding(formData: FormData) {
  const displayName = (formData.get('display_name') as string | null)?.trim()
  const avatarUrl = formData.get('avatar_url') as string | null

  if (!displayName || displayName.length < 2) {
    redirect('/onboarding?error=name_too_short')
  }
  if (displayName.length > 40) {
    redirect('/onboarding?error=name_too_long')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      display_name: displayName,
      avatar_url: avatarUrl ?? null,
      onboarding_complete: true,
    })
    .eq('id', user.id)

  if (error) redirect('/onboarding?error=failed')

  const posthog = getPostHogClient()
  posthog.identify({
    distinctId: user.id,
    properties: { $set: { display_name: displayName } },
  })
  posthog.capture({
    distinctId: user.id,
    event: 'onboarding_completed',
    properties: { display_name: displayName },
  })
  await posthog.flush()

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
