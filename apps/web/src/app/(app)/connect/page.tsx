import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConnectClient } from './connect-client'
import { getConnectedIntegrations } from './actions'

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const integrations = await getConnectedIntegrations()

  // Also fetch OAuth integrations stored in user_integrations (e.g. Spotify)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oauthRows } = await (supabase as any)
    .from('user_integrations')
    .select('provider, updated_at')
    .eq('user_id', user.id)

  const oauthIntegrations = ((oauthRows ?? []) as { provider: string; updated_at: string }[]).map(r => ({
    provider:         r.provider,
    is_active:        true,
    last_synced_at:   r.updated_at,
    provider_user_id: null,
  }))

  const allIntegrations = [...integrations, ...oauthIntegrations]

  return (
    <ConnectClient
      connectedIntegrations={allIntegrations}
      flashConnected={params.connected ?? null}
      flashError={params.error ?? null}
    />
  )
}
