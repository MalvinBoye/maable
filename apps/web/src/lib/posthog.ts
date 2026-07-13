import { PostHog } from 'posthog-node'

let _client: PostHog | null = null

export function getPostHogClient(): PostHog {
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    })
  }
  return _client
}
