export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden animate-pulse" style={{ backgroundColor: '#fff' }}>
      <aside style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)', padding: '32px 24px 32px 40px' }}>
        <div style={{ height: 40, width: 160, backgroundColor: 'rgba(26,25,22,0.06)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 14, width: 100, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4, marginBottom: 32 }} />
        {[80, 60, 100, 70].map((w, i) => (
          <div key={i} style={{ height: 12, width: w, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4, marginBottom: 12 }} />
        ))}
      </aside>
      <main style={{ flex: 1, padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 120, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4 }} />
        ))}
      </main>
    </div>
  )
}
