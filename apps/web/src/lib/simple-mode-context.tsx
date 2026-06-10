'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SimpleModeCtx {
  simpleMode: boolean
  toggleSimpleMode: () => void
}

const SimpleModeContext = createContext<SimpleModeCtx>({ simpleMode: false, toggleSimpleMode: () => {} })

export function useSimpleMode() {
  return useContext(SimpleModeContext)
}

export function SimpleModeProvider({ children }: { children: React.ReactNode }) {
  const [simpleMode, setSimpleMode] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'in' | 'out'>('idle')
  const pendingRef = useRef<boolean | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem('maable-focus-mode') === 'true') setSimpleMode(true)
    } catch { /* ignore */ }
  }, [])

  const toggleSimpleMode = useCallback(() => {
    if (phase !== 'idle') return
    const next = !simpleMode
    pendingRef.current = next

    // Phase 1: curtain sweeps in
    setPhase('in')

    // Flip the mode at peak coverage
    setTimeout(() => {
      setSimpleMode(next)
      try { localStorage.setItem('maable-focus-mode', String(next)) } catch { /* ignore */ }
      // Phase 2: curtain sweeps out
      setPhase('out')
    }, 380)

    // Done
    setTimeout(() => {
      setPhase('idle')
      pendingRef.current = null
    }, 760)
  }, [simpleMode, phase])

  return (
    <SimpleModeContext.Provider value={{ simpleMode, toggleSimpleMode }}>
      {children}

      {/* ── Transition curtain ───────────────────────────────────────────── */}
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            key="curtain"
            initial={{ clipPath: 'circle(0% at 50% 45%)' }}
            animate={
              phase === 'in'
                ? { clipPath: 'circle(150% at 50% 45%)' }
                : { clipPath: 'circle(0% at 50% 45%)' }
            }
            transition={{ duration: 0.38, ease: [0.76, 0, 0.24, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              backgroundColor: '#0c0b09',
              pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.p
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: phase === 'in' ? 1 : 0, scale: phase === 'in' ? 1 : 0.85 }}
              transition={{ delay: phase === 'in' ? 0.18 : 0, duration: 0.18 }}
              style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '1.05rem', color: 'rgba(201,168,76,0.70)',
                letterSpacing: '0.06em',
              }}
            >
              {pendingRef.current ? 'entering focus' : 'returning'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </SimpleModeContext.Provider>
  )
}
