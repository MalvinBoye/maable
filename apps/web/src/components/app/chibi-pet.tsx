'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { askChibi } from '@/app/(app)/chibi/actions'
import type { RevisionCard, ChibiAction } from '@/lib/chibi/types'

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

type ChibiExpression = 'calm' | 'alert' | 'happy' | 'thinking'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
          Revising {subject}
        </p>
        <p className="text-xs text-stone-400" style={{ fontFamily: 'Georgia, serif' }}>{idx + 1}/{total}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-stone-100 rounded">
        <motion.div className="h-full bg-stone-800 rounded" animate={{ width: `${((idx) / total) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col gap-4"
        >
          {/* Question */}
          <div className="p-5 bg-stone-50 border border-stone-100 flex-1 flex items-center">
            <p className="text-stone-800 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {card.prompt}
            </p>
          </div>

          {/* Answer (revealed or hidden) */}
          <AnimatePresence>
            {revealed ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                <div className="p-5 bg-white border-2 border-stone-900">
                  <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: 'Georgia, serif' }}>
                    {card.answer}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => next(true)} className="flex-1 py-2.5 text-sm bg-stone-900 text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>
                    Got it
                  </button>
                  <button onClick={() => next(false)} className="flex-1 py-2.5 text-sm border border-stone-200 text-stone-500" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>
                    Not quite
                  </button>
                </div>
              </motion.div>
            ) : (
              <button onClick={() => setRevealed(true)} className="w-full py-3 text-sm text-stone-500 border border-stone-200 hover:border-stone-400 transition-colors" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>
                Show answer
              </button>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <button onClick={onDone} className="text-xs text-stone-300 self-center" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer' }}>
        Exit revision
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ChibiPet({ username = 'User' }: { username?: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [expression, setExpression] = useState<ChibiExpression>('calm')
  const [isBlinking, setIsBlinking] = useState(false)
  const [lookDir, setLookDir] = useState<'center' | 'left' | 'right'>('center')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [revision, setRevision] = useState<{ cards: RevisionCard[]; subject: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const greeting = useRef(getGreeting(username)).current

  useEffect(() => {
    const id = setInterval(() => {
      setIsBlinking(true); setTimeout(() => setIsBlinking(false), 120)
    }, randomBetween(3000, 6000))
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const dirs: Array<'center' | 'left' | 'right'> = ['center', 'left', 'right', 'center']
    const id = setInterval(() => {
      setLookDir(dirs[Math.floor(Math.random() * dirs.length)] ?? 'center')
    }, randomBetween(2000, 5000))
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (isOpen) { setTimeout(() => inputRef.current?.focus(), 400); setExpression('happy'); setTimeout(() => setExpression('calm'), 1500) }
    else { setExpression('calm') }
  }, [isOpen])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const executeAction = useCallback((action: ChibiAction) => {
    switch (action.type) {
      case 'navigate':
        setIsOpen(false)
        setTimeout(() => router.push(action.href), 200)
        break
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
        setTimeout(() => router.push('/lazy'), 200)
        break
    }
  }, [router])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isPending) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setExpression('thinking')

    startTransition(async () => {
      const response = await askChibi(text)
      setMessages(prev => [...prev, { role: 'assistant', content: response.text }])
      setExpression('happy')
      setTimeout(() => setExpression('calm'), 2000)
      if (response.action) executeAction(response.action)
    })
  }, [isPending, executeAction])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  const hasMessages = messages.length > 0
  const showRevision = !!revision

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white shadow-md border border-stone-200 flex items-center justify-center overflow-hidden"
        style={{ animation: 'chibi-bob 3s ease-in-out infinite, chibi-pulse 4s ease-in-out infinite' }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        aria-label="Open Chibi"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/chibi-grumpy.png" alt="Chibi" className="w-10 h-10 object-contain" draggable={false} />
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chibi-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', backgroundColor: 'rgba(242, 240, 235, 0.93)' }}
          >
            {/* Texture */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat', backgroundSize: '256px 256px', opacity: 0.09, mixBlendMode: 'multiply' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(26,25,22,0.025) 80px)' }} />

            {/* Close */}
            <button onClick={() => { setIsOpen(false); setRevision(null) }}
              className="absolute top-5 right-6 z-10 text-stone-400 hover:text-stone-600 transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              esc · close
            </button>

            {/* ── Revision mode ─────────────────────────────────────────────── */}
            {showRevision ? (
              <RevisionMode
                cards={revision!.cards}
                subject={revision!.subject}
                onDone={() => setRevision(null)}
              />
            ) : (
              <>
                {/* Face (no messages) */}
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
                        {getExpressionText(expression, greeting)}
                      </motion.p>
                      {/* Hint pills */}
                      <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-lg">
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
                          <img src="/illustrations/chibi-calm.png" alt="" className="w-8 h-8 object-contain shrink-0 mt-1" draggable={false} />
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
                          {isPending && i === messages.length - 1 && msg.role === 'user'
                            ? null
                            : msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {isPending && (
                      <div className="flex gap-3 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/illustrations/chibi-calm.png" alt="" className="w-8 h-8 object-contain shrink-0" draggable={false} />
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
                      placeholder={isPending ? 'One sec...' : 'Ask me anything, or say "help me revise for..."'}
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
  "Open my notes",
  "Show urgent tasks",
  "How's my streak?",
  "I need motivation",
]

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getGreeting(name: string): string {
  const h = new Date().getHours()
  return `Good ${h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'}, ${name}`
}

function getExpressionText(expression: ChibiExpression, greeting: string): string {
  switch (expression) {
    case 'calm':     return greeting
    case 'alert':    return "Oh! I'm listening..."
    case 'happy':    return "Let's get things done!"
    case 'thinking': return 'On it...'
  }
}
