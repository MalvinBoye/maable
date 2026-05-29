'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <html>
      <body style={{ margin: 0, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 32px', backgroundColor: '#faf9f7', fontFamily: 'Georgia, serif' }}>
        <p style={{ fontSize: 22, fontStyle: 'italic', color: '#1a1916', margin: 0 }}>Maable hit an error.</p>
        <p style={{ fontSize: 13, color: '#78716c', margin: 0, lineHeight: 1.7, textAlign: 'center', maxWidth: 380 }}>
          Something went seriously wrong. Refresh the page or contact support if this persists.
        </p>
        <button onClick={reset} style={{ padding: '11px 28px', fontSize: 13, fontStyle: 'italic', fontFamily: 'Georgia, serif', backgroundColor: '#1a1916', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Reload
        </button>
      </body>
    </html>
  )
}
