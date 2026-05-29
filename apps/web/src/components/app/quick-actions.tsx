'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createNote } from '@/app/(app)/notes/actions'

// ─── Shared overlay backdrop ──────────────────────────────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className="fixed inset-0 z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    />
  )
}

// ─── Quick Note Modal ─────────────────────────────────────────────────────────

export function QuickNoteModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  async function save() {
    if (!title.trim() && !body.trim()) { onClose(); return }
    setStatus('saving')
    const res = await createNote({ title: title.trim() || 'Quick Note', body, tags: ['__quick'] })
    if (!res.error) {
      setStatus('done')
      setTimeout(onClose, 700)
    } else {
      setStatus('idle')
    }
  }

  return (
    <>
      <Backdrop onClick={onClose} />
      <motion.div
        key="quick-note"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-lg rounded-2xl overflow-hidden"
          style={{ background: '#0d0c0a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Quick note
            </span>
            <span className="text-xs text-stone-600">⌘↵ to save</span>
          </div>

          {/* Title */}
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title…"
            className="w-full bg-transparent text-white text-lg px-5 pb-2 outline-none placeholder-stone-700"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          />

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 20px' }} />

          {/* Body */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Start writing…"
            rows={6}
            className="w-full bg-transparent text-stone-300 text-sm px-5 py-4 outline-none resize-none placeholder-stone-700 leading-relaxed"
          />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 pb-5 pt-2">
            <button
              onClick={onClose}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors px-3 py-1.5 rounded-lg"
            >
              Cancel
            </button>
            <motion.button
              onClick={save}
              disabled={status !== 'idle'}
              whileHover={status === 'idle' ? { scale: 1.04 } : {}}
              whileTap={status === 'idle' ? { scale: 0.97 } : {}}
              className="text-xs px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                background: status === 'done' ? '#22c55e' : 'rgba(255,255,255,0.12)',
                color: status === 'done' ? '#fff' : '#d6d3d1',
              }}
            >
              {status === 'saving' ? 'Saving…' : status === 'done' ? 'Saved ✓' : 'Save note'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─── Quick Timer Modal ────────────────────────────────────────────────────────

type Preset = { label: string; seconds: number }
const PRESETS: Preset[] = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '15 min', seconds: 15 * 60 },
  { label: '5 min',  seconds:  5 * 60 },
]
const DEFAULT_PRESET: Preset = PRESETS[0] ?? { label: '25 min', seconds: 25 * 60 }

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function QuickTimerModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro')
  const [preset, setPreset] = useState<Preset>(DEFAULT_PRESET)
  const [remaining, setRemaining] = useState(DEFAULT_PRESET.seconds)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const tick = useCallback(() => {
    if (mode === 'pomodoro') {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current!); setRunning(false); return 0 }
        return r - 1
      })
    } else {
      setElapsed(e => e + 1)
    }
  }, [mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tick])

  function selectPreset(p: typeof PRESETS[0]) {
    setPreset(p)
    setRemaining(p.seconds)
    setRunning(false)
  }

  function reset() {
    setRunning(false)
    if (mode === 'pomodoro') setRemaining(preset.seconds)
    else setElapsed(0)
  }

  function switchMode(m: 'pomodoro' | 'stopwatch') {
    setMode(m)
    setRunning(false)
    setElapsed(0)
    setRemaining(preset.seconds)
  }

  const current = mode === 'pomodoro' ? remaining : elapsed
  const progress = mode === 'pomodoro'
    ? remaining / preset.seconds
    : (elapsed % 3600) / 3600
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const done = mode === 'pomodoro' && remaining === 0

  return (
    <>
      <Backdrop onClick={onClose} />
      <motion.div
        key="quick-timer"
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 24 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div
          className="pointer-events-auto w-80 rounded-2xl overflow-hidden flex flex-col items-center"
          style={{ background: '#0d0c0a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', padding: '28px 24px 24px' }}
        >
          {/* Mode toggle */}
          <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {(['pomodoro', 'stopwatch'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="text-xs px-4 py-1.5 rounded-lg transition-all capitalize"
                style={{
                  background: mode === m ? 'rgba(255,255,255,0.14)' : 'transparent',
                  color: mode === m ? '#fff' : '#78716c',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Ring */}
          <div className="relative flex items-center justify-center mb-4" style={{ width: 180, height: 180 }}>
            <svg width={180} height={180} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
              {/* Track */}
              <circle cx={90} cy={90} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
              {/* Progress */}
              <motion.circle
                cx={90} cy={90} r={RADIUS}
                fill="none"
                stroke={done ? '#22c55e' : '#f5e6a0'}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="text-center z-10">
              <span
                className="text-white"
                style={{ fontFamily: 'Georgia, serif', fontSize: 38, fontStyle: 'italic', letterSpacing: '-1px' }}
              >
                {formatTime(current)}
              </span>
              {done && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs mt-1"
                  style={{ color: '#22c55e', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Done!
                </motion.p>
              )}
            </div>
          </div>

          {/* Presets (pomodoro only) */}
          <AnimatePresence>
            {mode === 'pomodoro' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 mb-5 overflow-hidden"
              >
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => selectPreset(p)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: preset.label === p.label ? 'rgba(245,230,160,0.18)' : 'rgba(255,255,255,0.06)',
                      color: preset.label === p.label ? '#f5e6a0' : '#78716c',
                      border: preset.label === p.label ? '1px solid rgba(245,230,160,0.35)' : '1px solid transparent',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              title="Reset"
            >
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <path d="M2 7a5 5 0 1 0 1.5-3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                <path d="M2 3.5V7h3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <motion.button
              onClick={() => setRunning(r => !r)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="w-14 h-14 rounded-full flex items-center justify-center text-stone-900 font-bold text-lg"
              style={{ background: done ? '#22c55e' : '#f5e6a0', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
            >
              {running ? (
                <svg width={18} height={18} viewBox="0 0 18 18" fill="currentColor">
                  <rect x={3} y={2} width={4} height={14} rx={1.5} />
                  <rect x={11} y={2} width={4} height={14} rx={1.5} />
                </svg>
              ) : (
                <svg width={18} height={18} viewBox="0 0 18 18" fill="currentColor">
                  <path d="M5 3.5l10 5.5-10 5.5V3.5z" />
                </svg>
              )}
            </motion.button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              title="Close"
            >
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
