import { NextResponse } from 'next/server'
import { createSign } from 'crypto'
import { createClient } from '@/lib/supabase/server'

// Generates an Apple Music developer token (JWT signed with ES256).
// Required env vars:
//   APPLE_MUSIC_TEAM_ID      — 10-char team ID from Apple Developer account
//   APPLE_MUSIC_KEY_ID       — Key ID from the MusicKit key in Developer portal
//   APPLE_MUSIC_PRIVATE_KEY  — Contents of the .p8 private key file (literal \n OK)

export async function GET() {
  // Auth-gate: only logged-in users may fetch a developer token
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId     = process.env.APPLE_MUSIC_TEAM_ID
  const keyId      = process.env.APPLE_MUSIC_KEY_ID
  const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY

  if (!teamId || !keyId || !privateKey) {
    return NextResponse.json({ error: 'Apple Music not configured' }, { status: 500 })
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 60 * 60 * 12  // 12-hour token

  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: now, exp })).toString('base64url')

  const toSign = `${header}.${payload}`
  const signer = createSign('SHA256')
  signer.update(toSign)

  const pem = privateKey.replace(/\\n/g, '\n')
  const sig  = signer.sign({ key: pem, dsaEncoding: 'ieee-p1363' }, 'base64url')

  const token = `${toSign}.${sig}`

  return NextResponse.json({ token }, {
    headers: { 'Cache-Control': 'private, max-age=43200' },
  })
}
