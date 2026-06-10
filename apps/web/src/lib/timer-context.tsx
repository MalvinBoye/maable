'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types & context ──────────────────────────────────────────────────────────

interface TimerCtx {
  timeLeft: number
  initialTime: number
  isRunning: boolean
  timerLabel: string
  hasActiveTimer: boolean
  startTimer: (seconds: number, label?: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
}

const Ctx = createContext<TimerCtx>({
  timeLeft: 0, initialTime: 0, isRunning: false, timerLabel: 'Focus', hasActiveTimer: false,
  startTimer: () => {}, pauseTimer: () => {}, resumeTimer: () => {}, stopTimer: () => {},
})

export const useTimer = () => useContext(Ctx)

export const TIMER_PRESETS = [
  { label: '5 min',  seconds: 5 * 60,  tag: 'Quick' },
  { label: '15 min', seconds: 15 * 60, tag: 'Break' },
  { label: '25 min', seconds: 25 * 60, tag: 'Pomodoro' },
  { label: '45 min', seconds: 45 * 60, tag: 'Deep work' },
]

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

// ─── Floating widget ──────────────────────────────────────────────────────────

function FloatingTimer() {
  const { timeLeft, initialTime, isRunning, timerLabel, pauseTimer, resumeTimer, stopTimer } = useTimer()
  const pct = initialTime > 0 ? timeLeft / initialTime : 0
  const r = 28
  const circ = 2 * Math.PI * r
  const done = timeLeft === 0 && initialTime > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 72, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 72, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      style={{
        position: 'fixed',
        right: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 200,
        backgroundColor: '#131210',
        border: `1px solid ${done ? 'rgba(201,168,76,0.55)' : 'rgba(201,168,76,0.18)'}`,
        borderRadius: 14,
        width: 150,
        overflow: 'hidden',
        boxShadow: done
          ? '0 0 40px rgba(201,168,76,0.12), 0 12px 40px rgba(0,0,0,0.50)'
          : '0 12px 40px rgba(0,0,0,0.45)',
      }}
    >
      {/* Dot grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }} />
      {/* Gold top rule */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(201,168,76,0.30)' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '18px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>

        {/* Label */}
        <p style={{ fontSize: '0.50rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', fontFamily: 'Georgia, serif' }}>
          {timerLabel}
        </p>

        {/* Progress ring + time */}
        <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={72} height={72} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2.5} />
            <motion.circle
              cx={36} cy={36} r={r} fill="none"
              stroke={done ? '#c9a84c' : isRunning ? '#c9a84c' : 'rgba(201,168,76,0.38)'}
              strokeWidth={2.5} strokeLinecap="round"
              strokeDasharray={`${circ}`}
              animate={{ strokeDashoffset: (1 - pct) * circ }}
              initial={false}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />
          </svg>
          <motion.p
            key={done ? 'done' : 'time'}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: done ? '0.82rem' : '1.12rem',
              color: done ? '#c9a84c' : 'rgba(255,255,255,0.88)',
              lineHeight: 1, textAlign: 'center',
            }}
          >
            {done ? 'done!' : fmt(timeLeft)}
          </motion.p>
        </div>

        {/* Running indicator */}
        {isRunning && !done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#c9a84c', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.55rem', color: 'rgba(201,168,76,0.50)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              running
            </span>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          {!done && (
            isRunning ? (
              <button
                onClick={pauseTimer}
                style={{
                  flex: 1, fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  padding: '5px 0', borderRadius: 5,
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', backgroundColor: 'transparent',
                  transition: 'color 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.80)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}
              >
                pause
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                style={{
                  flex: 1, fontSize: '0.62rem', color: '#c9a84c',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  padding: '5px 0', borderRadius: 5,
                  border: '1px solid rgba(201,168,76,0.30)',
                  cursor: 'pointer', backgroundColor: 'transparent',
                }}
              >
                resume
              </button>
            )
          )}
          <button
            onClick={stopTimer}
            style={{
              flex: 1, fontSize: '0.62rem',
              color: 'rgba(255,255,255,0.22)',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              padding: '5px 0', borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer', backgroundColor: 'transparent',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.22)' }}
          >
            {done ? 'close' : 'stop'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft]       = useState(0)
  const [initialTime, setInitialTime] = useState(0)
  const [isRunning, setIsRunning]     = useState(false)
  const [timerLabel, setTimerLabel]   = useState('Focus')
  const [hasActiveTimer, setHasActiveTimer] = useState(false)

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setIsRunning(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isRunning])

  const startTimer = useCallback((seconds: number, label = 'Focus') => {
    setTimeLeft(seconds)
    setInitialTime(seconds)
    setTimerLabel(label)
    setIsRunning(true)
    setHasActiveTimer(true)
  }, [])

  const pauseTimer  = useCallback(() => setIsRunning(false), [])
  const resumeTimer = useCallback(() => { setIsRunning(true) }, [])
  const stopTimer   = useCallback(() => {
    setIsRunning(false)
    setHasActiveTimer(false)
    setTimeLeft(0)
    setInitialTime(0)
  }, [])

  return (
    <Ctx value={{ timeLeft, initialTime, isRunning, timerLabel, hasActiveTimer, startTimer, pauseTimer, resumeTimer, stopTimer }}>
      {children}
      <AnimatePresence>
        {hasActiveTimer && <FloatingTimer key="floating-timer" />}
      </AnimatePresence>
    </Ctx>
  )
}
