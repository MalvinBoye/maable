import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
].join(' ')

export async function GET() {
  const clientId    = process.env.SPOTIFY_CLIENT_ID
  const base        = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const redirectUri = `${base}/api/auth/spotify/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'Spotify not configured' }, { status: 500 })
  }

  // Require the user to be logged in before initiating OAuth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${base}/login`)
  }

  // Generate a CSRF state token tied to this request
  const state = randomBytes(32).toString('hex')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    scope:         SCOPES,
    redirect_uri:  redirectUri,
    state,
  })

  const response = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`)

  // Store state in a short-lived httpOnly cookie for CSRF verification in callback
  response.cookies.set('spotify_oauth_state', state, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    600,  // 10 minutes
    path:      '/api/auth/spotify',
  })

  return response
}
