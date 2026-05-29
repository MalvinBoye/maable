export default function NotesLoading() {
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden animate-pulse" style={{ backgroundColor: '#fff' }}>
      <aside style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)', padding: '32px 24px 32px 40px' }}>
        <div style={{ height: 36, width: 80, backgroundColor: 'rgba(26,25,22,0.06)', borderRadius: 4, marginBottom: 24 }} />
        {[...Array(5)].map((_, i) => <div key={i} style={{ height: 44, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4, marginBottom: 8 }} />)}
      </aside>
      <main style={{ flex: 1, padding: '32px 40px' }}>
        <div style={{ height: 28, width: 300, backgroundColor: 'rgba(26,25,22,0.06)', borderRadius: 4, marginBottom: 20 }} />
        {[100, 60, 80, 40, 90, 70].map((w, i) => <div key={i} style={{ height: 14, width: `${w}%`, backgroundColor: 'rgba(26,25,22,0.04)', borderRadius: 4, marginBottom: 12 }} />)}
      </main>
    </div>
  )
}
