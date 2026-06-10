export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden" style={{ backgroundColor: '#ffffff' }}>

      {/* ── Left panel: illustration + branding ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col"
        style={{
          width: '58%',
          backgroundColor: '#faf9f7',
          borderRight: '1px solid rgba(26,25,22,0.07)',
        }}
      >
        {/* Wordmark */}
        <div className="px-12 pt-10 shrink-0">
          <span
            className="text-2xl text-stone-800 select-none"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Maable
          </span>
        </div>

        {/* Mascot */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/mascot.png"
            alt="Maable"
            style={{ width: '80%', maxWidth: 340, objectFit: 'contain' }}
            draggable={false}
          />
        </div>

        {/* Tagline + feature lines */}
        <div className="px-12 pb-12 shrink-0">
          <p
            className="text-xl text-stone-700 mb-5"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Make life manageable.
          </p>
          <ul className="space-y-2">
            {[
              'Track tasks and build lasting habits',
              'Level up with every win you log',
              'Beat the leaderboard. Beat yourself.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                <p className="text-sm text-stone-500" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {line}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel: form ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Mobile wordmark */}
        <p
          className="lg:hidden text-2xl text-stone-800 mb-10 select-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Maable
        </p>

        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>
    </div>
  )
}
