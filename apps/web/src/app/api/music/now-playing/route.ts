import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptToken, decryptToken } from '@/lib/encrypt'

const SPOTIFY_TOKEN_URL      = 'https://accounts.spotify.com/api/token'
const SPOTIFY_NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing'

async function refreshSpotifyToken(encryptedRefresh: string, tokenKey: string): Promise<string | null> {
  const clientId     = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const refreshToken = decryptToken(encryptedRefresh, tokenKey)
  if (!refreshToken) return null

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:  `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) return null
  const data = await res.json() as { access_token?: string }
  return data.access_token ?? null
}

export async function GET() {
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokenKey = process.env.TOKEN_ENCRYPTION_KEY
  if (!tokenKey) return NextResponse.json({ connected: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: integration } = await (supabase as any)
    .from('user_integrations')
    .select('access_token, refresh_token')
    .eq('user_id', user.id)
    .eq('provider', 'spotify')
    .single()

  if (!integration) {
    return NextResponse.json({ connected: false })
  }

  const row = integration as { access_token: string; refresh_token: string | null }

  // Decrypt stored access token
  let accessToken = decryptToken(row.access_token, tokenKey)
  if (!accessToken) return NextResponse.json({ connected: true, playing: false })

  let spotifyRes = await fetch(SPOTIFY_NOW_PLAYING_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  // 401 — try refresh
  if (spotifyRes.status === 401 && row.refresh_token) {
    const newRaw = await refreshSpotifyToken(row.refresh_token, tokenKey)
    if (!newRaw) return NextResponse.json({ connected: true, playing: false })

    accessToken = newRaw
    const encNew = encryptToken(newRaw, tokenKey)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('user_integrations')
      .update({ access_token: encNew })
      .eq('user_id', user.id)
      .eq('provider', 'spotify')

    spotifyRes = await fetch(SPOTIFY_NOW_PLAYING_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  if (spotifyRes.status === 204 || !spotifyRes.ok) {
    return NextResponse.json({ connected: true, playing: false })
  }

  interface SpotifyTrack {
    is_playing: boolean
    item?: {
      name: string
      artists: Array<{ name: string }>
      album: { name: string; images: Array<{ url: string }> }
      external_urls: { spotify: string }
      duration_ms: number
    }
    progress_ms?: number
  }

  const data = await spotifyRes.json() as SpotifyTrack
  if (!data.is_playing || !data.item) {
    return NextResponse.json({ connected: true, playing: false })
  }

  return NextResponse.json({
    connected: true,
    playing:   true,
    track: {
      name:      data.item.name,
      artist:    data.item.artists.map(a => a.name).join(', '),
      album:     data.item.album.name,
      albumArt:  data.item.album.images[0]?.url ?? null,
      url:       data.item.external_urls.spotify,
      progress:  data.progress_ms ?? 0,
      duration:  data.item.duration_ms,
    },
  })
}
