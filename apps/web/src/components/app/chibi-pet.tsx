'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { askChibi, getChibiStatus } from '@/app/(app)/chibi/actions'
import type { RevisionCard, ChibiAction } from '@/lib/chibi/types'
import type { ChibiMood } from '@/app/(app)/chibi/actions'
import { useTimer } from '@/lib/timer-context'
import { useSimpleMode } from '@/lib/simple-mode-context'

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

type ChibiExpression = 'calm' | 'alert' | 'happy' | 'thinking' | 'sad' | 'mad' | 'ecstatic'

const MOOD_TO_EXPR: Record<ChibiMood, ChibiExpression> = {
  ecstatic: 'ecstatic',
  happy:    'happy',
  calm:     'calm',
  worried:  'alert',
  sad:      'sad',
  mad:      'mad',
}

const MOOD_IMAGE: Record<ChibiMood, string> = {
  ecstatic: '/illustrations/chibi-happy.png',
  happy:    '/illustrations/chibi-happy.png',
  calm:     '/illustrations/chibi-calm.png',
  worried:  '/illustrations/chibi-alert.png',
  sad:      '/illustrations/chibi-tired.png',
  mad:      '/illustrations/chibi-grumpy.png',
}

const MOOD_RING: Record<ChibiMood, string> = {
  ecstatic: '#c9a84c',
  happy:    '#86efac',
  calm:     '#e7e5e4',
  worried:  '#fdba74',
  sad:      '#93c5fd',
  mad:      '#fca5a5',
}

interface Message { role: 'user' | 'assistant'; content: string }

// ─── SVG Face ─────────────────────────────────────────────────────────────────

function ChibiFace({ expression, isBlinking, lookDir = 'center' }: {
  expression: ChibiExpression; isBlinking?: boolean; lookDir?: 'center' | 'left' | 'right'
}) {
  const ox = lookDir === 'left' ? -3 : lookDir === 'right' ? 3 : 0
  return (
    <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
      {expression === 'calm' && (
        <>
          <motion.g animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.08 }} style={{ transformOrigin: '130px 120px' }}>
            <g transform={`translate(${ox}, 0)`}>
              <rect x="90" y="108" width="80" height="8" rx="4" fill="#1a1916" />
              <rect x="90" y="120" width="80" height="8" rx="4" fill="#1a1916" />
              <rect x="90" y="132" width="80" height="8" rx="4" fill="#1a1916" />
            </g>
          </motion.g>
          <motion.g animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.08 }} style={{ transformOrigin: '270px 120px' }}>
            <g transform={`translate(${ox}, 0)`}>
              <rect x="230" y="108" width="80" height="8" rx="4" fill="#1a1916" />
              <rect x="230" y="120" width="80" height="8" rx="4" fill="#1a1916" />
              <rect x="230" y="132" width="80" height="8" rx="4" fill="#1a1916" />
            </g>
          </motion.g>
          <path d="M 168 210 Q 200 240 232 210" stroke="#1a1916" strokeWidth="6" strokeLinecap="round" fill="none" />
        </>
      )}

      {expression === 'alert' && (
        <>
          <motion.g animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.08 }} style={{ transformOrigin: '130px 120px' }}>
            <g transform={`translate(${ox}, 0)`}><circle cx="130" cy="120" r="46" fill="#1a1916" /></g>
          </motion.g>
          <motion.g animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.08 }} style={{ transformOrigin: '270px 120px' }}>
            <g transform={`translate(${ox}, 0)`}><circle cx="270" cy="120" r="46" fill="#1a1916" /></g>
          </motion.g>
          <path d="M 165 215 C 175 205, 185 225, 200 215 C 215 205, 225 225, 235 215" stroke="#1a1916" strokeWidth="6" strokeLinecap="round" fill="none" />
        </>
      )}

      {expression === 'happy' && (
        <>
          <motion.g animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.08 }}>
            <path d={`M ${90+ox} 135 Q ${130+ox} 100 ${170+ox} 135`} stroke="#1a1916" strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d={`M ${230+ox} 135 Q ${270+ox} 100 ${310+ox} 135`} stroke="#1a1916" strokeWidth="9" strokeLinecap="round" fill="none" />
          </motion.g>
          <path d="M 155 200 Q 200 255 245 200" stroke="#1a1916" strokeWidth="8" strokeLinecap="round" fill="none" />
        </>
      )}

      {expression === 'thinking' && (
        <>
          <motion.g animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.08 }} style={{ transformOrigin: '130px 120px' }}>
            <g transform={`translate(${ox}, 0)`}><circle cx="130" cy="120" r="30" fill="#1a1916" /></g>
          </motion.g>
          <g transform={`translate(${ox}, 0)`}><rect x="238" y="115" width="64" height="10" rx="5" fill="#1a1916" /></g>
          <rect x="175" y="215" width="50" height="7" rx="3.5" fill="#1a1916" />
        </>
      )}

      {/* ── NEW: Sad ── */}
      {expression === 'sad' && (
        <>
          {/* Drooping sad eyes */}
          <motion.g animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.08 }}>
            <path d={`M ${90+ox} 108 Q ${130+ox} 142 ${170+ox} 108`} stroke="#1a1916" strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d={`M ${230+ox} 108 Q ${270+ox} 142 ${310+ox} 108`} stroke="#1a1916" strokeWidth="9" strokeLinecap="round" fill="none" />
          </motion.g>
          {/* Sad eyebrows (outer corners lower) */}
          <path d={`M ${98+ox} 86 Q ${130+ox} 78 ${164+ox} 90`} stroke="#1a1916" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d={`M ${238+ox} 90 Q ${270+ox} 78 ${304+ox} 86`} stroke="#1a1916" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Frown */}
          <path d="M 168 228 Q 200 210 232 228" stroke="#1a1916" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Teardrops */}
          <motion.ellipse cx="148" cy="168" rx="7" ry="11" fill="#93c5fd" opacity="0.65"
            animate={{ cy: [168, 192, 168] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="288" cy="168" rx="7" ry="11" fill="#93c5fd" opacity="0.65"
            animate={{ cy: [168, 192, 168] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
        </>
      )}

      {/* ── NEW: Mad ── */}
      {expression === 'mad' && (
        <>
          {/* Angry eyebrows (\/) */}
          <path d={`M ${88+ox} 85 L ${168+ox} 108`} stroke="#1a1916" strokeWidth="8" strokeLinecap="round" />
          <path d={`M ${232+ox} 108 L ${312+ox} 85`} stroke="#1a1916" strokeWidth="8" strokeLinecap="round" />
          {/* Squinted eyes */}
          <motion.g animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.08 }}>
            <rect x={`${95+ox}`} y="115" width="70" height="11" rx="5.5" fill="#1a1916" />
            <rect x={`${235+ox}`} y="115" width="70" height="11" rx="5.5" fill="#1a1916" />
          </motion.g>
          {/* Grumpy wavy mouth */}
          <path d="M 162 222 C 178 210 190 232 200 220 C 210 208 222 230 238 218"
            stroke="#1a1916" strokeWidth="6.5" strokeLinecap="round" fill="none" />
          {/* Anger veins */}
          <path d="M 72 68 L 82 56 L 92 68" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M 308 68 L 318 56 L 328 68" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
        </>
      )}

      {/* ── NEW: Ecstatic ── */}
      {expression === 'ecstatic' && (
        <>
          {/* Star/sparkle eyes */}
          <motion.g animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <g transform={`translate(${130+ox} 120)`}>
              <line x1="0" y1="-30" x2="0" y2="30" stroke="#1a1916" strokeWidth="7" strokeLinecap="round" />
              <line x1="-26" y1="-13" x2="26" y2="13" stroke="#1a1916" strokeWidth="7" strokeLinecap="round" />
              <line x1="26" y1="-13" x2="-26" y2="13" stroke="#1a1916" strokeWidth="7" strokeLinecap="round" />
            </g>
            <g transform={`translate(${270+ox} 120)`}>
              <line x1="0" y1="-30" x2="0" y2="30" stroke="#1a1916" strokeWidth="7" strokeLinecap="round" />
              <line x1="-26" y1="-13" x2="26" y2="13" stroke="#1a1916" strokeWidth="7" strokeLinecap="round" />
              <line x1="26" y1="-13" x2="-26" y2="13" stroke="#1a1916" strokeWidth="7" strokeLinecap="round" />
            </g>
          </motion.g>
          {/* Huge smile */}
          <path d="M 142 195 Q 200 272 258 195" stroke="#1a1916" strokeWidth="9" strokeLinecap="round" fill="none" />
          {/* Blush */}
          <circle cx="96" cy="178" r="26" fill="#fda4af" opacity="0.38" />
          <circle cx="304" cy="178" r="26" fill="#fda4af" opacity="0.38" />
          {/* Sparkle dots */}
          <motion.circle cx="340" cy="62" r="5" fill="#c9a84c"
            animate={{ scale: [1, 1.6, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.4, repeat: Infinity }} />
          <motion.circle cx="60" cy="72" r="4" fill="#c9a84c"
            animate={{ scale: [1, 1.6, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.5 }} />
          <motion.circle cx="350" cy="180" r="3.5" fill="#c9a84c"
            animate={{ scale: [1, 1.6, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.9 }} />
        </>
      )}
    </svg>
  )
}

// ─── Revision Mode ────────────────────────────────────────────────────────────

function RevisionMode({ cards, subject, onDone }: { cards: RevisionCard[]; subject: string; onDone: () => void }) {
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)

  const card = cards[idx]
  const total = cards.length

  const next = (gotIt: boolean) => {
    if (gotIt) setCorrect(c => c + 1)
    if (idx + 1 >= total) { setFinished(true); return }
    setIdx(i => i + 1)
    setRevealed(false)
  }

  if (finished) {
    const pct = Math.round((correct / total) * 100)
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
        <p className="text-3xl text-stone-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{pct >= 80 ? 'Solid session.' : pct >= 50 ? 'Getting there.' : 'Keep at it.'}</p>
        <p className="text-stone-500 text-sm" style={{ fontFamily: 'Georgia, serif' }}>{correct}/{total} cards · {pct}% on {subject}</p>
        <div className="flex gap-3">
          <button onClick={() => { setIdx(0); setRevealed(false); setFinished(false); setCorrect(0) }}
            className="px-5 py-2.5 text-sm bg-stone-900 text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>
            Go again
          </button>
          <button onClick={onDone} className="px-5 py-2.5 text-sm border border-stone-200 text-stone-500" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>
            Done
          </button>
        </div>
      </motion.div>
    )
  }

  if (!card) return null

  return (
    <div className="flex flex-col h-full px-6 pt-14 pb-6 gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>Revising {subject}</p>
        <p className="text-xs text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{idx + 1}/{total}</p>
      </div>
      <div className="h-1 bg-stone-100 rounded">
        <motion.div className="h-full bg-stone-800 rounded" animate={{ width: `${((idx) / total) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col gap-4">
          <div className="p-5 bg-stone-50 border border-stone-100 flex-1 flex items-center">
            <p className="text-stone-800 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{card.prompt}</p>
          </div>
          <AnimatePresence>
            {revealed ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                <div className="p-5 bg-white border-2 border-stone-900">
                  <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: 'Georgia, serif' }}>{card.answer}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => next(true)} className="flex-1 py-2.5 text-sm bg-stone-900 text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>Got it</button>
                  <button onClick={() => next(false)} className="flex-1 py-2.5 text-sm border border-stone-200 text-stone-500" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>Not quite</button>
                </div>
              </motion.div>
            ) : (
              <button onClick={() => setRevealed(true)} className="w-full py-3 text-sm text-stone-500 border border-stone-200 hover:border-stone-400 transition-colors" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>Show answer</button>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      <button onClick={onDone} className="text-xs text-stone-300 self-center" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer' }}>Exit revision</button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ChibiPet({ username = 'User' }: { username?: string }) {
  const router = useRouter()
  const { startTimer } = useTimer()
  const { simpleMode, toggleSimpleMode } = useSimpleMode()

  const [isOpen, setIsOpen] = useState(false)
  const [expression, setExpression] = useState<ChibiExpression>('calm')
  const [isBlinking, setIsBlinking] = useState(false)
  const [lookDir, setLookDir] = useState<'center' | 'left' | 'right'>('center')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [revision, setRevision] = useState<{ cards: RevisionCard[]; subject: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Companion mode
  const [companionMode, setCompanionMode] = useState(false)
  const [currentMood, setCurrentMood] = useState<ChibiMood>('calm')
  const [reminderQueue, setReminderQueue] = useState<string[]>([])
  const [activeReminder, setActiveReminder] = useState<string | null>(null)
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const greeting = useRef(getGreeting(username)).current

  // Load companion mode from localStorage
  useEffect(() => {
    try {
      if (localStorage.getItem('maable-companion-mode') === 'true') setCompanionMode(true)
    } catch { /* ignore */ }
  }, [])

  // Blink loop
  useEffect(() => {
    const id = setInterval(() => { setIsBlinking(true); setTimeout(() => setIsBlinking(false), 120) }, randomBetween(3000, 6000))
    return () => clearInterval(id)
  }, [])

  // Look direction loop
  useEffect(() => {
    const dirs: Array<'center' | 'left' | 'right'> = ['center', 'left', 'right', 'center']
    const id = setInterval(() => { setLookDir(dirs[Math.floor(Math.random() * dirs.length)] ?? 'center') }, randomBetween(2000, 5000))
    return () => clearInterval(id)
  }, [])

  // Open/close expression change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400)
      setExpression('happy')
      setTimeout(() => setExpression(MOOD_TO_EXPR[currentMood]), 1500)
    } else {
      setExpression(MOOD_TO_EXPR[currentMood])
    }
  }, [isOpen, currentMood])

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  // Mood check + companion polling
  const checkMood = useCallback(async () => {
    if (document.hidden) return
    try {
      const status = await getChibiStatus()
      setCurrentMood(status.mood)
      if (companionMode && status.reminders.length > 0) {
        setReminderQueue(q => [...new Set([...q, ...status.reminders])])
      }
    } catch { /* silent */ }
  }, [companionMode])

  useEffect(() => {
    checkMood()
  }, [checkMood])

  useEffect(() => {
    if (!companionMode) return
    const id = setInterval(checkMood, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [companionMode, checkMood])

  // Drain reminder queue one by one
  useEffect(() => {
    if (activeReminder || reminderQueue.length === 0 || isOpen) return
    const [next, ...rest] = reminderQueue
    setActiveReminder(next ?? null)
    setReminderQueue(rest)
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current)
    reminderTimerRef.current = setTimeout(() => setActiveReminder(null), 6500)
  }, [reminderQueue, activeReminder, isOpen])

  const dismissReminder = useCallback(() => {
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current)
    setActiveReminder(null)
  }, [])

  const toggleCompanion = useCallback(() => {
    setCompanionMode(prev => {
      const next = !prev
      try { localStorage.setItem('maable-companion-mode', String(next)) } catch { /* ignore */ }
      if (next) checkMood()
      return next
    })
  }, [checkMood])

  const executeAction = useCallback((action: ChibiAction) => {
    switch (action.type) {
      case 'navigate':
      case 'open_notes':
        setIsOpen(false)
        setTimeout(() => router.push(action.href), 200)
        break
      case 'revise':
        setRevision({ cards: action.cards, subject: action.subject })
        break
      case 'lazy_mode':
        setIsOpen(false)
        setTimeout(() => router.push('/lazy'), 200)
        break
      case 'timer':
        setIsOpen(false)
        startTimer(action.minutes * 60, 'Focus')
        break
    }
  }, [router, startTimer])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isPending) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setExpression('thinking')
    startTransition(async () => {
      const response = await askChibi(text)
      setMessages(prev => [...prev, { role: 'assistant', content: response.text }])
      setExpression('happy')
      setTimeout(() => setExpression(MOOD_TO_EXPR[currentMood]), 2000)
      if (response.action) executeAction(response.action)
    })
  }, [isPending, executeAction, currentMood])

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); sendMessage(input) }

  const hasMessages  = messages.length > 0
  const showRevision = !!revision
  const moodExpr     = MOOD_TO_EXPR[currentMood]

  return (
    <>
      {/* ── Reminder bubble ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeReminder && !isOpen && (
          <motion.div
            key="reminder"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={dismissReminder}
            style={{
              position: 'fixed', bottom: 90, right: 24, zIndex: 39,
              maxWidth: 220,
              backgroundColor: '#131210',
              border: '1px solid rgba(201,168,76,0.22)',
              borderRadius: 10,
              padding: '10px 14px',
              cursor: 'pointer',
              boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            }}
          >
            {/* Tail */}
            <div style={{
              position: 'absolute', bottom: -7, right: 22,
              width: 14, height: 14,
              backgroundColor: '#131210',
              border: '1px solid rgba(201,168,76,0.22)',
              borderTop: 'none', borderLeft: 'none',
              transform: 'rotate(45deg)',
            }} />
            {/* Mood dot */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: MOOD_RING[currentMood], flexShrink: 0, marginTop: 4 }} />
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.76rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>
                {activeReminder}
              </p>
            </div>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.55rem', color: 'rgba(255,255,255,0.22)', marginTop: 6, textAlign: 'right' }}>
              tap to dismiss
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating button ──────────────────────────────────────────────────── */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: '#fff',
          boxShadow: `0 0 0 2.5px ${MOOD_RING[currentMood]}, 0 4px 16px rgba(0,0,0,0.14)`,
          transition: 'box-shadow 0.4s ease',
          animation: 'chibi-bob 3s ease-in-out infinite',
        }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        aria-label="Open Chibi"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MOOD_IMAGE[currentMood]} alt="Chibi" className="w-10 h-10 object-contain" draggable={false} />
        {/* Companion mode indicator */}
        {companionMode && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: 1, right: 1,
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: MOOD_RING[currentMood],
              border: '1.5px solid #fff',
            }}
          />
        )}
      </motion.button>

      {/* ── Overlay ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chibi-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', backgroundColor: 'rgba(242,240,235,0.93)' }}
          >
            {/* Texture */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat', backgroundSize: '256px 256px', opacity: 0.09, mixBlendMode: 'multiply' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(26,25,22,0.025) 80px)' }} />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-5 pb-3 z-10">
              {/* Companion + mode toggles */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleCompanion}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontFamily: 'Georgia, serif', fontStyle: 'italic',
                    fontSize: '0.72rem',
                    color: companionMode ? '#1a1916' : 'rgba(26,25,22,0.42)',
                    backgroundColor: companionMode ? `${MOOD_RING[currentMood]}30` : 'rgba(26,25,22,0.05)',
                    border: `1px solid ${companionMode ? MOOD_RING[currentMood] : 'rgba(26,25,22,0.12)'}`,
                    borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <motion.span
                    animate={companionMode ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ repeat: companionMode ? Infinity : 0, duration: 1.8 }}
                    style={{ fontSize: '0.85rem' }}
                  >
                    {moodExpr === 'ecstatic' ? '✨' : moodExpr === 'happy' ? '☀' : moodExpr === 'sad' ? '🫧' : moodExpr === 'mad' ? '💢' : '◉'}
                  </motion.span>
                  Companion {companionMode ? 'on' : 'off'}
                </button>

                {companionMode && currentMood !== 'calm' && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    style={{
                      fontFamily: 'Georgia, serif', fontStyle: 'italic',
                      fontSize: '0.65rem', color: 'rgba(26,25,22,0.45)',
                      backgroundColor: `${MOOD_RING[currentMood]}20`,
                      border: `1px solid ${MOOD_RING[currentMood]}50`,
                      borderRadius: 20, padding: '3px 10px',
                    }}
                  >
                    {currentMood}
                  </motion.span>
                )}

                {/* Focus mode shortcut */}
                <button
                  onClick={() => { setIsOpen(false); setTimeout(toggleSimpleMode, 100) }}
                  style={{
                    fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem',
                    color: simpleMode ? '#c9a84c' : 'rgba(26,25,22,0.42)',
                    backgroundColor: simpleMode ? 'rgba(201,168,76,0.10)' : 'rgba(26,25,22,0.05)',
                    border: `1px solid ${simpleMode ? 'rgba(201,168,76,0.35)' : 'rgba(26,25,22,0.12)'}`,
                    borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
                  }}
                >
                  {simpleMode ? '◉ focus on' : '◎ focus off'}
                </button>
              </div>

              <button
                onClick={() => { setIsOpen(false); setRevision(null) }}
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,25,22,0.40)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(26,25,22,0.75)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(26,25,22,0.40)' }}
              >
                esc · close
              </button>
            </div>

            {/* Revision mode */}
            {showRevision ? (
              <RevisionMode cards={revision!.cards} subject={revision!.subject} onDone={() => setRevision(null)} />
            ) : (
              <>
                {/* Face */}
                <AnimatePresence>
                  {!hasMessages && (
                    <motion.div
                      initial={{ scale: 0.82, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                      className="flex-1 flex flex-col items-center justify-center px-8"
                    >
                      <div style={{ width: 'min(72vw, 780px)', height: 'min(54vw, 585px)' }}>
                        <ChibiFace expression={expression} isBlinking={isBlinking} lookDir={lookDir} />
                      </div>
                      <motion.p key={expression} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-stone-500 text-base tracking-wide"
                        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                      >
                        {getExpressionText(expression, greeting, currentMood)}
                      </motion.p>

                      {/* Quick hints */}
                      <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-xl">
                        {QUICK_HINTS.map(h => (
                          <button key={h} onClick={() => sendMessage(h)}
                            className="px-3 py-1.5 text-xs text-stone-500 border border-stone-200 hover:border-stone-400 transition-colors"
                            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.6)' }}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message thread */}
                {hasMessages && (
                  <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pt-14 pb-4 flex flex-col gap-4" style={{ scrollbarWidth: 'none' }}>
                    {messages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {msg.role === 'assistant' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={MOOD_IMAGE[currentMood]} alt="" className="w-8 h-8 object-contain shrink-0 mt-1" draggable={false} />
                        )}
                        <div className="max-w-[72%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line"
                          style={{
                            fontFamily: 'Georgia, serif',
                            backgroundColor: msg.role === 'user' ? 'rgba(26,25,22,0.07)' : 'rgba(255,255,255,0.75)',
                            color: '#1a1916',
                            borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            border: '1px solid rgba(26,25,22,0.06)',
                          }}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {isPending && (
                      <div className="flex gap-3 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={MOOD_IMAGE[currentMood]} alt="" className="w-8 h-8 object-contain shrink-0" draggable={false} />
                        <div className="inline-flex gap-1 items-center px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: '18px 18px 18px 4px', border: '1px solid rgba(26,25,22,0.06)' }}>
                          {[0,1,2].map(i => (
                            <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Input */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.3 }}
                  className="relative z-10 w-full max-w-3xl mx-auto px-8 pb-10 flex items-center gap-3"
                >
                  <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      disabled={isPending}
                      placeholder={isPending ? 'One sec...' : 'Ask me anything, or "start a 25 min timer"...'}
                      className="flex-1 border border-stone-300 rounded-full px-6 py-3.5 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-colors disabled:opacity-60"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.7)' }}
                    />
                    <motion.button type="submit" disabled={!input.trim() || isPending}
                      className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0 disabled:opacity-40"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.button>
                  </form>
                  {hasMessages && (
                    <motion.button onClick={() => setMessages([])}
                      className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      ✕
                    </motion.button>
                  )}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUICK_HINTS = [
  "What's due today?",
  "Help me revise for...",
  "Show urgent tasks",
  "How's my streak?",
  "Start a 25 min timer",
  "Take me to notes",
  "Open career goals",
  "I need motivation",
  "How am I doing?",
  "Switch to focus mode",
]

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getGreeting(name: string): string {
  const h = new Date().getHours()
  return `Good ${h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'}, ${name}`
}

function getExpressionText(expression: ChibiExpression, greeting: string, mood: ChibiMood): string {
  switch (expression) {
    case 'calm':     return greeting
    case 'alert':    return "Something needs your attention..."
    case 'happy':    return "You're doing great, keep it up!"
    case 'thinking': return 'On it...'
    case 'sad':      return mood === 'sad' ? "You've been slacking... I believe in you though." : "Let's get back on track."
    case 'mad':      return "You PROMISED you'd do those tasks. Come on."
    case 'ecstatic': return "You're absolutely crushing it today!!"
  }
}
