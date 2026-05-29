import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBoardItems } from './actions'
import { BoardClient } from './board-client'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const items = await getBoardItems()

  return <BoardClient userId={user.id} initialItems={items} />
}
