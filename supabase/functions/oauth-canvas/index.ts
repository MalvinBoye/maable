/**
 * oauth-canvas Edge Function
 *
 * Handles Canvas LMS OAuth2 flow.
 * Canvas uses OAuth 2.0 with per-institution base URLs.
 *
 * GET  /functions/v1/oauth-canvas?action=authorize&canvas_url=<institution_url>
 * GET  /functions/v1/oauth-canvas?action=callback&code=<code>&state=<state>
 *
 * NOTE: The callback URL registered in Canvas must be:
 *   https://<project-ref>.supabase.co/functions/v1/oauth-canvas?action=callback
 * NOT the APP_URL — it must be the Supabase functions URL.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY           = Deno.env.get('SUPABASE_ANON_KEY')!
const CANVAS_CLIENT_ID   = Deno.env.get('CANVAS_CLIENT_ID')!
const CANVAS_CLIENT_SECRET = Deno.env.get('CANVAS_CLIENT_SECRET')!
const APP_URL            = Deno.env.get('APP_URL')!

// The callback URL must match exactly what is registered in Canvas developer keys.
// It must be the Supabase functions URL, not the app URL.
const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/oauth-canvas?action=callback`

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  const url    = new URL(req.url)
  const action = url.searchParams.get('action')

  // ── AUTHORIZE: kick off the OAuth flow ──────────────────────────────────────
  if (action === 'authorize') {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const canvasUrl = url.searchParams.get('canvas_url')
    if (!canvasUrl) return new Response('canvas_url required', { status: 400 })

    // Normalise: strip trailing slash, ensure https
    const normalised = canvasUrl.replace(/\/$/, '').replace(/^http:\/\//, 'https://')

    // Generate a state token and store canvas_url in oauth_states so the callback can read it
    const stateId = crypto.randomUUID()
    const { error: stateErr } = await adminSupabase
      .from('oauth_states')
      .insert({
        id:       stateId,
        user_id:  user.id,
        provider: 'canvas',
        metadata: { canvas_url: normalised },
      })

    if (stateErr) {
      console.error('Failed to store oauth state', stateErr)
      return new Response('Failed to initiate auth', { status: 500 })
    }

    const params = new URLSearchParams({
      client_id:     CANVAS_CLIENT_ID,
      response_type: 'code',
      redirect_uri:  CALLBACK_URL,
      state:         stateId,
      purpose:       'Maable — import assignments and due dates',
    })

    return Response.redirect(`${normalised}/login/oauth2/auth?${params}`)
  }

  // ── CALLBACK: Canvas redirects the user's browser here ──────────────────────
  if (action === 'callback') {
    const code    = url.searchParams.get('code')
    const stateId = url.searchParams.get('state')
    const errParam = url.searchParams.get('error')

    if (errParam) {
      return Response.redirect(`${APP_URL}/connect?error=${encodeURIComponent(errParam)}`)
    }
    if (!code || !stateId) {
      return Response.redirect(`${APP_URL}/connect?error=invalid_callback`)
    }

    // Look up the state to get user_id + canvas_url
    const { data: stateRow, error: stateLookupErr } = await adminSupabase
      .from('oauth_states')
      .select('*')
      .eq('id', stateId)
      .eq('provider', 'canvas')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateLookupErr || !stateRow) {
      return Response.redirect(`${APP_URL}/connect?error=state_expired`)
    }

    const { user_id, metadata } = stateRow as { user_id: string; metadata: { canvas_url: string } }
    const canvasUrl = metadata.canvas_url

    // Exchange code for access token
    const tokenRes = await fetch(`${canvasUrl}/login/oauth2/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'authorization_code',
        client_id:     CANVAS_CLIENT_ID,
        client_secret: CANVAS_CLIENT_SECRET,
        redirect_uri:  CALLBACK_URL,
        code,
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('Canvas token exchange failed', tokenRes.status, body)
      return Response.redirect(`${APP_URL}/connect?error=token_exchange_failed`)
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      refresh_token?: string
      user?: { id: number; name: string }
    }

    // Encrypt the access token before storing
    const { data: encrypted, error: encErr } = await adminSupabase
      .rpc('encrypt_token', { token: tokenData.access_token })

    if (encErr || !encrypted) {
      console.error('Token encryption failed', encErr)
      return Response.redirect(`${APP_URL}/connect?error=encryption_failed`)
    }

    // Store in integrations table
    const { error: upsertErr } = await adminSupabase
      .from('integrations')
      .upsert({
        user_id,
        provider:               'canvas',
        provider_user_id:       canvasUrl,                // store the institution URL here
        access_token_encrypted: encrypted,
        refresh_token_encrypted: tokenData.refresh_token
          ? (await adminSupabase.rpc('encrypt_token', { token: tokenData.refresh_token })).data ?? null
          : null,
        scopes:         ['url:GET|/api/v1/courses', 'url:GET|/api/v1/assignments'],
        is_active:      true,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' })

    if (upsertErr) {
      console.error('Failed to store integration', upsertErr)
      return Response.redirect(`${APP_URL}/connect?error=storage_failed`)
    }

    // Clean up the state record
    await adminSupabase.from('oauth_states').delete().eq('id', stateId)

    return Response.redirect(`${APP_URL}/connect?connected=canvas`)
  }

  return new Response('Unknown action', { status: 400 })
})
