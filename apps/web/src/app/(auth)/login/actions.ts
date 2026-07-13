'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidEmail } from '@maable/core'
import { getPostHogClient } from '@/lib/posthog'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null

  if (!email || !password || !isValidEmail(email)) {
    redirect('/login?error=invalid_credentials')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=invalid_credentials')
  }

  if (data.user) {
    const posthog = getPostHogClient()
    posthog.identify({ distinctId: data.user.id })
    posthog.capture({ distinctId: data.user.id, event: 'user_logged_in' })
    await posthog.flush()
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const posthog = getPostHogClient()
    posthog.capture({ distinctId: user.id, event: 'user_logged_out' })
    await posthog.flush()
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
