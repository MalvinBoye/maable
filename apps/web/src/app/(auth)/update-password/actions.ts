'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string | null
  const confirm  = formData.get('confirm') as string | null

  if (!password || password.length < 8) {
    redirect('/update-password?error=too_short')
  }
  if (password !== confirm) {
    redirect('/update-password?error=mismatch')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/update-password?error=failed')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
