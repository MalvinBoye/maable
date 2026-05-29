import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-8" style={{ backgroundColor: '#faf9f7' }}>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 80, lineHeight: 1, color: 'rgba(26,25,22,0.08)', userSelect: 'none' }}>
        404
      </p>
      <div className="text-center -mt-4">
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22, color: '#1a1916', marginBottom: 8 }}>
          This page doesn&apos;t exist.
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#78716c', lineHeight: 1.7 }}>
          It may have moved, or you may have followed a broken link.
        </p>
      </div>
      <Link
        href="/dashboard"
        style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          padding: '12px 28px', fontSize: 14,
          backgroundColor: '#1a1916', color: '#fff',
          textDecoration: 'none', display: 'inline-block',
        }}
      >
        Back to Maable
      </Link>
    </div>
  )
}
