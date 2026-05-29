'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidEmail, isStrongPassword, isValidUsername, sanitizeText } from '@maable/core'

export async function signup(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null
  const rawUsername = formData.get('username') as string | null
  const username = rawUsername ? sanitizeText(rawUsername).toLowerCase() : null

  if (!email || !password || !username) {
    redirect('/signup?error=missing_fields')
  }

  if (!isValidEmail(email)) redirect('/signup?error=invalid_email')
  if (!isStrongPassword(password)) redirect('/signup?error=weak_password')
  if (!isValidUsername(username)) redirect('/signup?error=invalid_username')

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      redirect('/signup?error=email_taken')
    }
    redirect('/signup?error=unknown')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
