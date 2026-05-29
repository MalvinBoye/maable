import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GamesHub } from './games-hub'

export default async function GamesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <GamesHub userId={user.id} />
}
