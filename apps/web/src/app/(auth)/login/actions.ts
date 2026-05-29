'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidEmail } from '@maable/core'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null

  if (!email || !password || !isValidEmail(email)) {
    redirect('/login?error=invalid_credentials')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=invalid_credentials')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
