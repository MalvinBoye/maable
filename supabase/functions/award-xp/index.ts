/**
 * award-xp Edge Function
 *
 * Called server-side to award XP to a user for a specific action.
 * Uses service role key — never expose this to the client.
 *
 * POST /functions/v1/award-xp
 * Body: { user_id, source, amount, metadata? }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface AwardXpPayload {
  user_id: string
  source: string
  amount: number
  metadata?: Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Verify the request comes from an authenticated user or a trusted service
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: AwardXpPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { user_id, source, amount, metadata } = payload

  if (!user_id || !source || !amount || amount <= 0) {
    return new Response('Invalid payload', { status: 400 })
  }

  // Verify the requesting user matches the user_id (or is service role)
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await userClient.auth.getUser()

  if (!user || user.id !== user_id) {
    return new Response('Forbidden', { status: 403 })
  }

  const { error } = await supabase.from('xp_transactions').insert({
    user_id,
    source,
    amount,
    metadata: metadata ?? null,
  })

  if (error) {
    console.error('XP award error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, awarded: amount }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
