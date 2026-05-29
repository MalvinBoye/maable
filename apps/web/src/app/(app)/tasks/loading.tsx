export default function TasksLoading() {
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden animate-pulse" style={{ backgroundColor: '#fff' }}>
      <aside style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)', padding: '32px 24px 32px 40px' }}>
        <div style={{ height: 36, width: 120, backgroundColor: 'rgba(26,25,22,0.06)', borderRadius: 4, marginBottom: 24 }} />
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 10, width: [80,100,60,90][i], backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4, marginBottom: 16 }} />)}
      </aside>
      <main style={{ flex: 1, padding: '32px 40px' }}>
        <div style={{ height: 36, width: 200, backgroundColor: 'rgba(26,25,22,0.06)', borderRadius: 4, marginBottom: 24 }} />
        {[...Array(6)].map((_, i) => <div key={i} style={{ height: 52, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4, marginBottom: 10 }} />)}
      </main>
    </div>
  )
}
