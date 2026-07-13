import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptToken } from '@/lib/encrypt'
import { getPostHogClient } from '@/lib/posthog'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const error = searchParams.get('error')
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Verify CSRF state cookie
  const storedState = request.cookies.get('spotify_oauth_state')?.value
  if (!storedState || !returnedState || storedState !== returnedState) {
    return NextResponse.redirect(`${base}/connect?error=spotify_state_mismatch`)
  }

  if (error || !code) {
    return NextResponse.redirect(`${base}/connect?error=spotify_denied`)
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const tokenKey = process.env.TOKEN_ENCRYPTION_KEY
  const redirectUri = `${base}/api/auth/spotify/callback`

  if (!clientId || !clientSecret || !tokenKey) {
    return NextResponse.redirect(`${base}/connect?error=spotify_config`)
  }

  // Exchange authorization code for tokens
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    return NextResponse.redirect(`${base}/connect?error=spotify_token`)
  }

  interface TokenResponse {
    access_token: string
    refresh_token?: string
    expires_in: number
  }
  const tokens = (await res.json()) as TokenResponse

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${base}/login`)
  }

  // Encrypt both tokens before persisting
  const encAccess = encryptToken(tokens.access_token, tokenKey)
  const encRefresh = tokens.refresh_token ? encryptToken(tokens.refresh_token, tokenKey) : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('user_integrations').upsert(
    {
      user_id: user.id,
      provider: 'spotify',
      access_token: encAccess,
      refresh_token: encRefresh,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    },
    { onConflict: 'user_id,provider' }
  )

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: user.id,
    event: 'integration_connected',
    properties: { provider: 'spotify' },
  })
  await posthog.flush()

  // Clear the CSRF state cookie
  const response = NextResponse.redirect(`${base}/connect?connected=Spotify`)
  response.cookies.delete('spotify_oauth_state')
  return response
}
