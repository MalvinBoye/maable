export default function LeaderboardLoading() {
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden animate-pulse" style={{ backgroundColor: '#fff' }}>
      <aside style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)', padding: '32px 24px 32px 40px' }}>
        <div style={{ height: 36, width: 140, backgroundColor: 'rgba(26,25,22,0.06)', borderRadius: 4, marginBottom: 24 }} />
        {[...Array(3)].map((_, i) => <div key={i} style={{ height: 36, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4, marginBottom: 8 }} />)}
      </aside>
      <main style={{ flex: 1, padding: '32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 40 }}>
          {[80, 112, 64].map((h, i) => <div key={i} style={{ width: 60, height: h, backgroundColor: 'rgba(26,25,22,0.05)', borderRadius: 4 }} />)}
        </div>
        {[...Array(8)].map((_, i) => <div key={i} style={{ height: 52, marginBottom: 1, backgroundColor: 'rgba(26,25,22,0.03)' }} />)}
      </main>
    </div>
  )
}
