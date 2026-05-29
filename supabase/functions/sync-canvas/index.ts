/**
 * sync-canvas Edge Function
 *
 * Fetches the authenticated user's Canvas assignments and upserts
 * them as Maable tasks. Safe to call multiple times — existing tasks
 * are matched by the `__canvas:{assignment_id}` tag and updated, not duplicated.
 *
 * POST /functions/v1/sync-canvas
 * Headers: Authorization: Bearer <user-jwt>
 *
 * Returns: { synced: number, courses: number, error?: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY            = Deno.env.get('SUPABASE_ANON_KEY')!
const TOKEN_ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY')!

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function decryptToken(b64: string, keyHex: string): Promise<string> {
  const buf  = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const iv   = buf.slice(0, 12)
  const tag  = buf.slice(12, 28)
  const ct   = buf.slice(28)
  const keyBytes = new Uint8Array(keyHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const key  = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
  // WebCrypto AES-GCM expects ciphertext with auth tag appended
  const ctWithTag = new Uint8Array([...ct, ...tag])
  const dec  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ctWithTag)
  return new TextDecoder().decode(dec)
}

interface CanvasCourse {
  id: number
  name: string
  course_code: string
}

interface CanvasAssignment {
  id: number
  name: string
  description: string | null
  due_at: string | null
  course_id: number
  submission_types: string[]
  points_possible: number | null
  html_url: string
  published: boolean
  workflow_state: string
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  // Verify the user is authenticated
  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Fetch the user's Canvas integration
  const { data: integration, error: intErr } = await adminSupabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'canvas')
    .eq('is_active', true)
    .single()

  if (intErr || !integration) {
    return Response.json({ error: 'Canvas not connected' }, { status: 400 })
  }

  // Decrypt the access token
  let token: string
  try {
    token = await decryptToken(integration.access_token_encrypted, TOKEN_ENCRYPTION_KEY)
  } catch (e) {
    console.error('decryptToken failed', e)
    return Response.json({ error: 'Token decryption failed' }, { status: 500 })
  }

  const canvasUrl = integration.provider_user_id as string
  const headers   = { Authorization: `Bearer ${token}` }

  // ── Fetch active courses ───────────────────────────────────────────────────
  const coursesRes = await fetch(
    `${canvasUrl}/api/v1/courses?per_page=50&enrollment_state=active&state[]=available`,
    { headers }
  )
  if (!coursesRes.ok) {
    return Response.json({ error: `Canvas API error: ${coursesRes.status}` }, { status: 502 })
  }
  const courses = await coursesRes.json() as CanvasCourse[]

  // ── Fetch assignments for each course ─────────────────────────────────────
  let synced = 0
  const now  = new Date().toISOString()

  for (const course of courses) {
    // Only fetch assignments due in the future (or recently past — within 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const assignRes = await fetch(
      `${canvasUrl}/api/v1/courses/${course.id}/assignments?` +
      `per_page=100&order_by=due_at&bucket=future&include[]=submission`,
      { headers }
    )
    if (!assignRes.ok) continue

    const assignments = await assignRes.json() as CanvasAssignment[]

    for (const a of assignments) {
      if (!a.published || a.workflow_state === 'deleted') continue

      // Tag used to identify this Canvas assignment in the tasks table
      const canvasTag = `__canvas:${a.id}`

      // Check if a task already exists for this assignment
      const { data: existing } = await adminSupabase
        .from('tasks')
        .select('id, status')
        .eq('user_id', user.id)
        .contains('tags', [canvasTag])
        .single()

      // Skip already-completed tasks — don't overwrite user progress
      if (existing?.status === 'done' || existing?.status === 'archived') continue

      const taskData = {
        user_id:    user.id,
        title:      a.name,
        description: a.description
          ? a.description.replace(/<[^>]+>/g, '').slice(0, 500) // strip HTML, cap length
          : null,
        due_date:   a.due_at ? a.due_at.slice(0, 10) : null,    // YYYY-MM-DD
        priority:   derivePriority(a.due_at),
        status:     'todo' as const,
        tags:       ['student', canvasTag, `__course:${course.course_code}`],
        sort_order: 0,
        updated_at: now,
      }

      if (existing) {
        await adminSupabase
          .from('tasks')
          .update({ title: taskData.title, due_date: taskData.due_date, priority: taskData.priority, updated_at: now })
          .eq('id', existing.id)
      } else {
        await adminSupabase.from('tasks').insert({ ...taskData, created_at: now })
        synced++
      }
    }
  }

  // Update last_synced_at
  await adminSupabase
    .from('integrations')
    .update({ last_synced_at: now })
    .eq('user_id', user.id)
    .eq('provider', 'canvas')

  return Response.json({ synced, courses: courses.length })
})

function derivePriority(dueAt: string | null): 'low' | 'medium' | 'high' | 'urgent' {
  if (!dueAt) return 'medium'
  const daysUntilDue = (new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (daysUntilDue <= 1) return 'urgent'
  if (daysUntilDue <= 3) return 'high'
  if (daysUntilDue <= 7) return 'medium'
  return 'low'
}
