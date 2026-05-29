'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Techniques ───────────────────────────────────────────────────────────────

interface Phase { label: string; secs: number }

interface Technique {
  id: string
  name: string
  tagline: string
  phases: Phase[]
  accent: string   // subtle accent colour — muted, fits the aesthetic
}

const TECHNIQUES: Technique[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    tagline: 'Used by Navy SEALs. Calm under pressure.',
    accent: '#57534e',
    phases: [
      { label: 'Breathe in',  secs: 4 },
      { label: 'Hold',        secs: 4 },
      { label: 'Breathe out', secs: 4 },
      { label: 'Hold',        secs: 4 },
    ],
  },
  {
    id: '478',
    name: '4 · 7 · 8',
    tagline: 'Activates your rest-and-digest response.',
    accent: '#6b7280',
    phases: [
      { label: 'Breathe in',  secs: 4 },
      { label: 'Hold',        secs: 7 },
      { label: 'Breathe out', secs: 8 },
    ],
  },
  {
    id: 'calm',
    name: 'Quick Calm',
    tagline: 'Reset in under a minute.',
    accent: '#78716c',
    phases: [
      { label: 'Breathe in',  secs: 3 },
      { label: 'Breathe out', secs: 6 },
    ],
  },
  {
    id: 'sigh',
    name: 'Physiological Sigh',
    tagline: 'Double inhale then a long sigh. Works instantly.',
    accent: '#a8a29e',
    phases: [
      { label: 'Inhale',      secs: 2 },
      { label: '+ Sniff',     secs: 1 },
      { label: 'Breathe out long', secs: 5 },
    ],
  },
]

// ─── Breathing circle ─────────────────────────────────────────────────────────
// The circle IS the guide — scale up = inhale, hold = no change, scale down = exhale
// No numbers. Let the animation speak.

function BreathingOrb({
  phase,
  accent,
  playing,
}: {
  phase: Phase
  accent: string
  playing: boolean
}) {
  const isIn  = phase.label.toLowerCase().includes('in')  || phase.label === '+ Sniff'
  const isOut = phase.label.toLowerCase().includes('out') || phase.label.toLowerCase().includes('sigh')
  const isHold = !isIn && !isOut

  // Target scale: inhale → big, exhale → small, hold → stay where it is
  const targetScale = isIn ? 1.48 : isOut ? 0.72 : undefined

  const dur = playing ? phase.secs : 2

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: 260, height: 260 }}
    >
      {/* Outer halo — very subtle, fades with hold */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 280, height: 280, border: '1px solid rgba(26,25,22,0.06)' }}
        animate={{ scale: isIn ? 1.06 : 1, opacity: isHold ? 0.4 : 0.9 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 240, height: 240, border: '1px solid rgba(26,25,22,0.10)' }}
        animate={targetScale !== undefined
          ? { scale: targetScale / 1.1 }
          : {}
        }
        transition={{ duration: dur, ease: 'easeInOut' }}
      />

      {/* Main orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 160,
          height: 160,
          backgroundColor: 'transparent',
          border: '1.5px solid rgba(26,25,22,0.22)',
          boxShadow: `inset 0 0 60px rgba(26,25,22,0.04), 0 0 60px rgba(26,25,22,0.04)`,
        }}
        animate={targetScale !== undefined ? { scale: targetScale } : {}}
        transition={{
          duration: dur * 0.95,
          ease: isIn ? [0.25, 0, 0.5, 1] : isOut ? [0.5, 0, 0.75, 1] : 'linear',
        }}
      >
        {/* Inner glow that breathes */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: accent }}
          animate={{ opacity: isIn ? 0.08 : isOut ? 0.02 : 0.05 }}
          transition={{ duration: dur, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Tiny centre dot */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 5, height: 5, backgroundColor: 'rgba(26,25,22,0.30)' }}
        animate={{ scale: isIn ? 1.8 : 1, opacity: isHold ? 0.5 : 0.9 }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─── Phase timer (internal — drives animation, NOT shown to user) ─────────────

function usePhaseTimer(technique: Technique, active: boolean) {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [breathCount, setBreathCount] = useState(0)
  const elapsed = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = useCallback(() => {
    setPhaseIdx(0)
    setBreathCount(0)
    elapsed.current = 0
  }, [])

  useEffect(() => { reset() }, [technique, reset])

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      elapsed.current = 0
      return
    }

    const phaseSecs = technique.phases[phaseIdx]?.secs ?? 4

    intervalRef.current = setInterval(() => {
      elapsed.current += 1
      if (elapsed.current >= phaseSecs) {
        elapsed.current = 0
        setPhaseIdx(p => {
          const next = (p + 1) % technique.phases.length
          if (next === 0) setBreathCount(b => b + 1)
          return next
        })
      }
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [active, phaseIdx, technique.phases])

  return { phase: technique.phases[phaseIdx]!, phaseIdx, breathCount, reset }
}

// ─── BreathingModal ───────────────────────────────────────────────────────────

export function BreathingModal({ onClose }: { onClose: () => void }) {
  const [techIdx, setTechIdx] = useState(0)
  const [active, setActive] = useState(false)
  const technique = TECHNIQUES[techIdx]!

  const { phase, phaseIdx, breathCount, reset } = usePhaseTimer(technique, active)

  const changeTech = (i: number) => { setActive(false); setTechIdx(i); reset() }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0d0c0a' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Very subtle vignette gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(26,25,22,0.0) 0%, rgba(0,0,0,0.40) 100%)',
        }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-7 right-8 transition-colors"
        style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.85rem', zIndex: 20 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)' }}
      >
        ✕
      </button>

      {/* Technique selector */}
      <div className="absolute top-7 left-0 right-0 flex justify-center gap-1.5 z-10">
        {TECHNIQUES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => changeTech(i)}
            className="px-3 py-1.5 text-xs rounded-full transition-all"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              backgroundColor: i === techIdx ? 'rgba(255,255,255,0.10)' : 'transparent',
              color: i === techIdx ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.22)',
              border: `1px solid ${i === techIdx ? 'rgba(255,255,255,0.14)' : 'transparent'}`,
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-10 z-10">

        {/* Phase label — the only text instruction */}
        <AnimatePresence mode="wait">
          <motion.p
            key={active ? phaseIdx : 'idle'}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: active ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.18)',
              fontSize: '0.9rem',
              letterSpacing: '0.08em',
              textTransform: 'lowercase',
            }}
          >
            {active ? phase.label : technique.tagline}
          </motion.p>
        </AnimatePresence>

        {/* The breathing orb — this is the whole experience */}
        <AnimatePresence mode="wait">
          <BreathingOrb
            key={active ? phaseIdx : 'idle'}
            phase={active ? phase : { label: 'Hold', secs: 2 }}
            accent={technique.accent}
            playing={active}
          />
        </AnimatePresence>

        {/* Start / pause */}
        <motion.button
          onClick={() => setActive(v => !v)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: '0.85rem',
            color: active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.60)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 40,
            padding: '8px 28px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'all 0.2s ease',
          }}
        >
          {active ? 'pause' : 'begin'}
        </motion.button>
      </div>

      {/* Breath counter — very minimal, bottom of screen */}
      <AnimatePresence>
        {breathCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.14)',
              fontSize: '0.75rem',
            }}
          >
            {breathCount} {breathCount === 1 ? 'cycle' : 'cycles'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Phase dots */}
      {active && (
        <div className="absolute bottom-8 flex gap-2">
          {technique.phases.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: i === phaseIdx ? 16 : 5,
                height: 5,
                backgroundColor: i === phaseIdx ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.10)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
