'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createCipheriv, randomBytes } from 'crypto'

function encryptToken(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex').subarray(0, 32)
  const iv  = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ct]).toString('base64')
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConnectedIntegration {
  provider: string
  is_active: boolean
  last_synced_at: string | null
  provider_user_id: string | null   // canvas_url for Canvas
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getConnectedIntegrations(): Promise<ConnectedIntegration[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('integrations')
    .select('provider, is_active, last_synced_at, provider_user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  return (data ?? []) as ConnectedIntegration[]
}

// ─── Canvas (Personal Access Token flow) ──────────────────────────────────────
//
// Canvas PATs are simpler than OAuth for institution-specific Canvas installs.
// Users generate a PAT in Canvas → Account → Settings → New Access Token.
// No client_id / client_secret needed. Works for any institution.

export async function connectCanvas(
  canvasUrl: string,
  token: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Normalise URL
  let normalised = canvasUrl.trim().replace(/\/$/, '')
  if (!normalised.startsWith('http')) normalised = `https://${normalised}`

  // Validate it looks like a real URL
  try { new URL(normalised) } catch {
    return { error: 'Invalid Canvas URL — use the format canvas.youruni.edu' }
  }

  // Verify the token actually works by hitting /api/v1/users/self
  try {
    const res = await fetch(`${normalised}/api/v1/users/self?per_page=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) return { error: 'Invalid token — please generate a new access token in Canvas.' }
    if (!res.ok) return { error: `Canvas returned ${res.status}. Check the URL and try again.` }
  } catch {
    return { error: 'Could not reach Canvas. Check the URL (no typos, must be your institution\'s Canvas).' }
  }

  // Encrypt the token before storing
  const tokenKey = process.env.TOKEN_ENCRYPTION_KEY
  if (!tokenKey) return { error: 'Encryption key not configured. Contact support.' }

  const encrypted = encryptToken(token, tokenKey)

  // Upsert into integrations table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upsertErr } = await (supabase as any)
    .from('integrations')
    .upsert({
      user_id:                user.id,
      provider:               'canvas',
      provider_user_id:       normalised,
      access_token_encrypted: encrypted,
      scopes:                 ['url:GET|/api/v1/courses', 'url:GET|/api/v1/assignments'],
      is_active:              true,
      last_synced_at:         null,
    }, { onConflict: 'user_id,provider' })

  if (upsertErr) {
    console.error('integrations upsert failed', upsertErr)
    return { error: 'Failed to save integration. Try again.' }
  }

  revalidatePath('/connect')
  revalidatePath('/student')

  // Trigger an initial sync in the background (fire-and-forget)
  // We don't await this — the user gets instant feedback
  triggerCanvasSync().catch(console.error)

  return { error: null }
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

export async function disconnectIntegration(
  provider: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider)

  if (error) return { error: 'Failed to disconnect.' }

  revalidatePath('/connect')
  revalidatePath('/student')
  revalidatePath('/career')
  revalidatePath('/hobbies')

  return { error: null }
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export async function triggerCanvasSync(): Promise<{ error: string | null; synced?: number }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return { error: 'Supabase URL not configured' }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/sync-canvas`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      return { error: body.error ?? `Sync failed (${res.status})` }
    }

    const result = await res.json() as { synced: number; courses: number }

    revalidatePath('/student')
    revalidatePath('/tasks')

    return { error: null, synced: result.synced }
  } catch (e) {
    console.error('sync-canvas fetch failed', e)
    return { error: 'Network error during sync' }
  }
}
