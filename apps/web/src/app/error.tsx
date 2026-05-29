'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-8" style={{ backgroundColor: '#faf9f7' }}>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22, color: '#1a1916', textAlign: 'center' }}>
        Something went wrong.
      </p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#78716c', textAlign: 'center', maxWidth: 380, lineHeight: 1.7 }}>
        An unexpected error occurred. Try refreshing — if it keeps happening, contact support.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '11px 24px', fontSize: 13, backgroundColor: '#1a1916', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Try again
        </button>
        <a
          href="/dashboard"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '11px 24px', fontSize: 13, color: '#78716c', border: '1px solid rgba(26,25,22,0.15)', textDecoration: 'none', display: 'inline-block' }}
        >
          Go home
        </a>
      </div>
    </div>
  )
}
