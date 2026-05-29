/**
 * revenuecat-webhook Edge Function
 *
 * Handles RevenueCat webhook events to update subscription status.
 * RevenueCat sends events for: INITIAL_PURCHASE, RENEWAL, CANCELLATION,
 * BILLING_ISSUE, PRODUCT_CHANGE, etc.
 *
 * POST /functions/v1/revenuecat-webhook
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!

// Map RevenueCat product IDs to our tiers
const PRODUCT_TO_TIER: Record<string, 'pro' | 'premium'> = {
  maable_pro_monthly: 'pro',
  maable_pro_annual: 'pro',
  maable_premium_monthly: 'premium',
  maable_premium_annual: 'premium',
}

interface RevenueCatEvent {
  event: {
    type: string
    app_user_id: string
    product_id: string
    store: string
    expiration_at_ms?: number
    purchased_at_ms?: number
    cancel_reason?: string
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  // Verify webhook signature
  const signature = req.headers.get('X-RevenueCat-Signature')
  if (!signature || signature !== WEBHOOK_SECRET) {
    return new Response('Invalid signature', { status: 401 })
  }

  const body: RevenueCatEvent = await req.json()
  const { type, app_user_id, product_id, store, expiration_at_ms, purchased_at_ms } = body.event

  const tier = PRODUCT_TO_TIER[product_id] ?? 'free'
  const platform = store === 'APP_STORE' ? 'ios' : store === 'PLAY_STORE' ? 'android' : 'web'

  const statusMap: Record<string, string> = {
    INITIAL_PURCHASE: 'active',
    RENEWAL: 'active',
    PRODUCT_CHANGE: 'active',
    CANCELLATION: 'canceled',
    BILLING_ISSUE: 'past_due',
    SUBSCRIBER_ALIAS: 'active',
    EXPIRATION: 'canceled',
    TRIAL_STARTED: 'trialing',
    TRIAL_CONVERTED: 'active',
    TRIAL_CANCELLED: 'canceled',
  }

  const status = statusMap[type] ?? 'active'

  // Update subscription record
  const { error: subError } = await supabase.from('subscriptions').upsert({
    user_id: app_user_id,
    tier: status === 'canceled' ? 'free' : tier,
    status,
    platform,
    provider_subscription_id: app_user_id,
    current_period_start: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : null,
    current_period_end: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
    canceled_at: type === 'CANCELLATION' ? new Date().toISOString() : null,
  })

  if (subError) {
    console.error('Subscription update error:', subError)
    return new Response('DB error', { status: 500 })
  }

  // Sync tier to profile
  await supabase.from('profiles').update({
    subscription_tier: status === 'canceled' ? 'free' : tier,
  }).eq('id', app_user_id)

  return new Response('OK', { status: 200 })
})
