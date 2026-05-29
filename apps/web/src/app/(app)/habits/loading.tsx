export default function HabitsLoading() {
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden animate-pulse" style={{ backgroundColor: '#fff' }}>
      <aside style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)', padding: '32px 24px 32px 40px' }}>
        <div style={{ height: 36, width: 100, backgroundColor: 'rgba(26,25,22,0.06)', borderRadius: 4, marginBottom: 24 }} />
        <div style={{ height: 60, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4 }} />
      </aside>
      <main style={{ flex: 1, padding: '32px 40px' }}>
        <div style={{ height: 36, width: 160, backgroundColor: 'rgba(26,25,22,0.06)', borderRadius: 4, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 100, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4 }} />)}
        </div>
      </main>
    </div>
  )
}
