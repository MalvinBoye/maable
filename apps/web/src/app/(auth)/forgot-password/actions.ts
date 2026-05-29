'use server'

import { createClient } from '@/lib/supabase/server'
import { isValidEmail } from '@maable/core'
import { redirect } from 'next/navigation'

export async function sendResetEmail(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()

  if (!email || !isValidEmail(email)) {
    redirect('/forgot-password?error=invalid_email')
  }

  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/update-password`,
  })

  // Always redirect to success — don't leak whether email exists
  redirect('/forgot-password?sent=1')
}
