'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useADHD } from '@/lib/adhd-context'

// ─── Shared palette ───────────────────────────────────────────────────────────

const NEON = ['#ff00ff', '#00ffff', '#ff3300', '#aaff00', '#ff9900', '#00ff88', '#ff0077', '#7700ff']
const CHIBI_VARIANTS = ['happy', 'calm', 'grumpy', 'tired', 'alert'] as const

// ═══════════════════════════════════════════════════════════════════════════════
//  CHIBI SPRINT  — 60 second tap game
// ═══════════════════════════════════════════════════════════════════════════════

const SPRINT_KEY = 'maable-sprint-best'
const SPRINT_SECS = 60

interface Target {
  id: string
  x: number   // 8–82 % of container
  y: number   // 8–72 %
  variant: typeof CHIBI_VARIANTS[number]
  lifetime: number   // ms
  bornAt: number
  xp: number
  combo?: boolean   // bonus chibi
}

function SprintGame({ ultra }: { ultra: boolean }) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'done'>('idle')
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore]     = useState(0)
  const [caught, setCaught]   = useState(0)
  const [timeLeft, setTimeLeft] = useState(SPRINT_SECS)
  const [best, setBest]       = useState(0)
  const [flash, setFlash]     = useState<{ id: string; x: number; y: number; xp: number } | null>(null)
  const [combo, setCombo]     = useState(0)    // consecutive catches < 1.5s apart

  const scoreRef   = useRef(0)
  const caughtRef  = useRef(0)
  const comboRef   = useRef(0)
  const lastCatch  = useRef(0)
  const startRef   = useRef(0)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const cleanRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBest(Number(localStorage.getItem(SPRINT_KEY) ?? 0))
  }, [])

  const clearAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (cleanRef.current) clearInterval(cleanRef.current)
  }, [])

  useEffect(() => clearAll, [clearAll])

  const spawnOne = useCallback(() => {
    const elapsed    = (Date.now() - startRef.current) / 1000
    const difficulty = Math.min(elapsed / 40, 1)
    const lifetime   = Math.round(2600 - difficulty * 1100)
    const xp         = elapsed > 35 ? 15 : 10
    const isBonus    = Math.random() < 0.12  // 12% chance golden bonus

    setTargets(prev => {
      const max = ultra ? 9 : 6
      if (prev.length >= max) return prev
      const t: Target = {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        x: 8 + Math.random() * 74,
        y: 8 + Math.random() * 64,
        variant: CHIBI_VARIANTS[Math.floor(Math.random() * CHIBI_VARIANTS.length)] ?? 'happy',
        lifetime,
        bornAt: Date.now(),
        xp: isBonus ? xp * 3 : xp,
        combo: isBonus,
      }
      return [...prev, t]
    })
  }, [ultra])

  const start = useCallback(() => {
    clearAll()
    scoreRef.current  = 0
    caughtRef.current = 0
    comboRef.current  = 0
    lastCatch.current = 0
    startRef.current  = Date.now()

    setStatus('playing')
    setScore(0); setCaught(0); setCombo(0); setTimeLeft(SPRINT_SECS); setTargets([])

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearAll()
          setTargets([])
          setStatus('done')
          const final = scoreRef.current
          setBest(prev => {
            const nb = Math.max(prev, final)
            localStorage.setItem(SPRINT_KEY, String(nb))
            return nb
          })
          return 0
        }
        return t - 1
      })
    }, 1000)

    const interval = ultra ? 650 : 950
    spawnRef.current = setInterval(spawnOne, interval)

    cleanRef.current = setInterval(() => {
      const now = Date.now()
      setTargets(prev => prev.filter(t => now - t.bornAt < t.lifetime))
    }, 80)
  }, [clearAll, spawnOne, ultra])

  const catchTarget = useCallback((t: Target) => {
    const now = Date.now()
    const dt  = now - lastCatch.current
    lastCatch.current = now

    const newCombo = dt < 1500 ? comboRef.current + 1 : 0
    comboRef.current = newCombo
    setCombo(newCombo)

    const multiplier = newCombo >= 4 ? 2 : newCombo >= 2 ? 1.5 : 1
    const earned     = Math.round(t.xp * multiplier)

    scoreRef.current  += earned
    caughtRef.current += 1
    setScore(scoreRef.current)
    setCaught(caughtRef.current)
    setTargets(prev => prev.filter(p => p.id !== t.id))
    setFlash({ id: t.id, x: t.x, y: t.y, xp: earned })
    setTimeout(() => setFlash(f => f?.id === t.id ? null : f), 500)
  }, [])

  const timerPct   = timeLeft / SPRINT_SECS
  const timerColor = timerPct > 0.4 ? (ultra ? '#00ffcc' : '#c9a84c') : timerPct > 0.2 ? '#f97316' : '#ef4444'
  const ringCirc   = 2 * Math.PI * 22

  // ─── Idle screen ─────────────────────────────────────────────────────────────

  if (status === 'idle') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, background: ultra ? '#050012' : 'transparent' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/illustrations/chibi-alert.png" alt="" draggable={false}
        style={{ width: 96, height: 96, objectFit: 'contain', filter: ultra ? 'drop-shadow(0 0 12px #00ffcc)' : 'none' }} />
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.9rem', color: ultra ? '#00ffcc' : '#1a1916', marginBottom: 6, textShadow: ultra ? '0 0 20px #00ffcc' : 'none' }}>
          Chibi Sprint
        </h2>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13.5, color: '#78716c', lineHeight: 1.65 }}>
          Catch the chibis before they slip away.<br />
          60 seconds. Combos multiply your XP.
        </p>
      </div>
      {best > 0 && (
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#a8a29e' }}>
          personal best · {best} xp
        </p>
      )}
      <motion.button
        onClick={start}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        style={{
          marginTop: 6, padding: '12px 36px',
          fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14,
          backgroundColor: ultra ? '#00ffcc' : '#1a1916',
          color: ultra ? '#050012' : '#fff',
          border: 'none', cursor: 'pointer',
          boxShadow: ultra ? '0 0 28px #00ffcc66' : '0 4px 16px rgba(0,0,0,0.18)',
        }}
      >
        {ultra ? '[ START ]' : 'Start game'}
      </motion.button>
    </div>
  )

  // ─── Done screen ──────────────────────────────────────────────────────────────

  if (status === 'done') {
    const isNewBest = score >= best && score > 0
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, background: ultra ? '#050012' : 'transparent' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/illustrations/chibi-${caught > 10 ? 'happy' : caught > 5 ? 'calm' : 'tired'}.png`} alt="" draggable={false}
          style={{ width: 90, height: 90, objectFit: 'contain', filter: ultra ? 'drop-shadow(0 0 10px #00ffcc)' : 'none' }} />

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '2.8rem', fontStyle: 'italic', color: ultra ? '#00ffcc' : '#1a1916', lineHeight: 1, textShadow: ultra ? '0 0 20px #00ffcc' : 'none' }}>
            {score}
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: '#78716c', marginTop: 4 }}>
            XP · {caught} chibis caught
          </p>
        </div>

        {isNewBest ? (
          <motion.p initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: '#c9a84c' }}>
            new personal best!
          </motion.p>
        ) : best > 0 ? (
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#a8a29e' }}>
            best · {best} xp
          </p>
        ) : null}

        <motion.button
          onClick={start}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          style={{
            marginTop: 8, padding: '11px 30px',
            fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14,
            backgroundColor: ultra ? '#00ffcc' : '#1a1916',
            color: ultra ? '#050012' : '#fff',
            border: 'none', cursor: 'pointer',
            boxShadow: ultra ? '0 0 24px #00ffcc66' : '0 4px 14px rgba(0,0,0,0.16)',
          }}
        >
          {ultra ? '[ AGAIN ]' : 'Try again'}
        </motion.button>
      </motion.div>
    )
  }

  // ─── Playing ──────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: ultra ? '#050012' : 'transparent', userSelect: 'none' }}>

      {/* Background grid */}
      {ultra && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(0,255,204,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,0.05) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />}

      {/* HUD */}
      <div style={{ position: 'absolute', top: 14, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', pointerEvents: 'none', zIndex: 10 }}>
        {/* Score */}
        <div>
          <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: ultra ? 'rgba(0,255,204,0.45)' : '#a8a29e', fontFamily: 'Georgia, serif', marginBottom: 1 }}>score</p>
          <motion.p key={score}
            initial={{ scale: 1.25, color: ultra ? '#ffff00' : '#c9a84c' }}
            animate={{ scale: 1, color: ultra ? '#00ffcc' : '#1a1916' }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: 32, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1, textShadow: ultra ? '0 0 16px #00ffcc' : 'none' }}
          >
            {score}
          </motion.p>
        </div>

        {/* Timer ring */}
        <div style={{ position: 'relative', width: 50, height: 50 }}>
          <svg width={50} height={50} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={25} cy={25} r={22} fill="none" stroke={ultra ? 'rgba(0,255,204,0.12)' : 'rgba(26,25,22,0.08)'} strokeWidth={3} />
            <circle cx={25} cy={25} r={22} fill="none" stroke={timerColor} strokeWidth={3}
              strokeDasharray={`${ringCirc}`}
              strokeDashoffset={`${ringCirc * (1 - timerPct)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s' }}
            />
          </svg>
          <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: timerColor, margin: 0 }}>
            {timeLeft}
          </p>
        </div>

        {/* Caught + combo */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: ultra ? 'rgba(0,255,204,0.45)' : '#a8a29e', fontFamily: 'Georgia, serif', marginBottom: 1 }}>caught</p>
          <p style={{ fontSize: 32, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1, color: ultra ? '#00ffcc' : '#1a1916' }}>{caught}</p>
          <AnimatePresence>
            {combo >= 2 && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 10, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#c9a84c', marginTop: 2 }}>
                x{combo >= 4 ? '2' : '1.5'} combo
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Targets */}
      <AnimatePresence>
        {targets.map(t => {
          const age       = Date.now() - t.bornAt
          const remaining = Math.max(0, t.lifetime - age) / t.lifetime
          const urgency   = 1 - remaining
          const isGolden  = t.combo

          return (
            <motion.button
              key={t.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: urgency > 0.75 ? 1 - (urgency - 0.75) * 3 : 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.14, type: 'spring', stiffness: 500, damping: 22 }}
              onClick={() => catchTarget(t)}
              style={{
                position: 'absolute',
                left: `${t.x}%`, top: `${t.y}%`,
                transform: 'translate(-50%, -50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                zIndex: 5,
              }}
            >
              <div style={{ position: 'relative' }}>
                {/* Countdown ring */}
                <svg style={{ position: 'absolute', top: -10, left: -10, pointerEvents: 'none' }} width={90} height={90}>
                  <circle cx={45} cy={45} r={40} fill="none"
                    stroke={isGolden ? '#c9a84c' : (ultra ? '#00ffcc' : '#1a1916')}
                    strokeWidth={2.5}
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * urgency}`}
                    strokeLinecap="round" opacity={0.55}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '45px 45px' }}
                  />
                </svg>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/illustrations/chibi-${t.variant}.png`} alt="" draggable={false}
                  style={{
                    width: isGolden ? 76 : 66, height: isGolden ? 76 : 66, objectFit: 'contain', display: 'block',
                    filter: isGolden
                      ? 'drop-shadow(0 0 8px #c9a84c) sepia(0.4) saturate(2)'
                      : ultra ? 'drop-shadow(0 0 6px #00ffcc)' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
                    pointerEvents: 'none',
                  }}
                />
                {/* XP badge */}
                <div style={{
                  position: 'absolute', top: -8, right: -8,
                  backgroundColor: isGolden ? '#c9a84c' : (ultra ? '#00ffcc' : '#1a1916'),
                  color: isGolden ? '#fff' : (ultra ? '#050012' : '#fff'),
                  borderRadius: 10, fontSize: 9, padding: '2px 6px',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.4,
                  boxShadow: isGolden ? '0 0 8px #c9a84c88' : 'none',
                }}>
                  +{t.xp}
                </div>
              </div>
            </motion.button>
          )
        })}
      </AnimatePresence>

      {/* Catch flash */}
      <AnimatePresence>
        {flash && (
          <motion.div key={flash.id}
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', left: `${flash.x}%`, top: `${flash.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 64, height: 64, borderRadius: '50%',
              backgroundColor: ultra ? '#00ffcc' : '#c9a84c',
              pointerEvents: 'none', zIndex: 20,
            }}
          />
        )}
      </AnimatePresence>

      {/* XP float */}
      <AnimatePresence>
        {flash && (
          <motion.p key={`xp-${flash.id}`}
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute', left: `${flash.x}%`, top: `${flash.y - 6}%`,
              transform: 'translateX(-50%)',
              fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15,
              color: ultra ? '#00ffcc' : '#c9a84c',
              pointerEvents: 'none', zIndex: 30,
              textShadow: ultra ? '0 0 10px #00ffcc' : 'none',
            }}
          >
            +{flash.xp}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PHYSICS SANDBOX
// ═══════════════════════════════════════════════════════════════════════════════

interface PhysObj {
  id: string
  x: number; y: number
  vx: number; vy: number
  w: number; h: number
  mass: number
  restitution: number
  friction: number
  rotation: number
  av: number
  grabbed: boolean
  kind: 'chibi' | 'card' | 'coin' | 'quote' | 'ball'
  variant?: string
  label?: string
  bounces?: number
  sizeMult?: number
}

const CHIBI_IMGS = ['happy', 'calm', 'grumpy', 'tired', 'alert'] as const

const TASK_LABELS = [
  'Inbox zero', 'Ship it', 'Take a break',
  'Drink water', 'Go for a walk', 'Learn something',
]

const QUOTES = [
  'done is better\nthan perfect',
  'one day or\nday one',
  'progress, not\nperfection',
  'show up\nevery day',
]

function mkChibi(id: string, variant: string, x: number, y: number): PhysObj {
  return { id, x, y, vx: (Math.random() - 0.5) * 3, vy: -4, w: 88, h: 108, mass: 1, restitution: 0.52, friction: 0.05, rotation: (Math.random() - 0.5) * 12, av: (Math.random() - 0.5) * 2.5, grabbed: false, kind: 'chibi', variant }
}
function mkCard(id: string, label: string, x: number, y: number): PhysObj {
  return { id, x, y, vx: (Math.random() - 0.5) * 2, vy: -1.5, w: 140, h: 80, mass: 0.8, restitution: 0.28, friction: 0.08, rotation: (Math.random() - 0.5) * 9, av: (Math.random() - 0.5) * 1.8, grabbed: false, kind: 'card', label }
}
function mkCoin(id: string, x: number, y: number): PhysObj {
  return { id, x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 2, w: 54, h: 54, mass: 0.45, restitution: 0.75, friction: 0.02, rotation: Math.random() * 360, av: (Math.random() - 0.5) * 5, grabbed: false, kind: 'coin' }
}
function mkBall(id: string, x: number, y: number, vx?: number, vy?: number): PhysObj {
  return { id, x, y, vx: vx ?? (Math.random() - 0.5) * 6, vy: vy ?? -3, w: 46, h: 46, mass: 0.6, restitution: 0.82, friction: 0.01, rotation: 0, av: (Math.random() - 0.5) * 4, grabbed: false, kind: 'ball', bounces: 0, sizeMult: 1 }
}
function mkQuote(id: string, label: string, x: number, y: number): PhysObj {
  return { id, x, y, vx: (Math.random() - 0.5) * 1.5, vy: -0.5, w: 172, h: 68, mass: 0.65, restitution: 0.3, friction: 0.1, rotation: (Math.random() - 0.5) * 5, av: (Math.random() - 0.5) * 1, grabbed: false, kind: 'quote', label }
}

function makeScene(): PhysObj[] {
  return [
    mkChibi('c1', 'happy', 230, 180),
    mkChibi('c2', 'calm', 570, 150),
    mkChibi('c3', 'grumpy', 870, 200),
    mkCard('t1', TASK_LABELS[0] ?? 'Ship it', 330, 300),
    mkCard('t2', TASK_LABELS[1] ?? 'Inbox zero', 620, 260),
    mkCard('t3', TASK_LABELS[2] ?? 'Take a break', 480, 170),
    mkCoin('k1', 160, 360), mkCoin('k2', 410, 330),
    mkCoin('k3', 700, 280), mkCoin('k4', 940, 350),
    mkBall('b1', 290, 120), mkBall('b2', 750, 90),
    mkQuote('q1', QUOTES[0] ?? 'keep going', 280, 420),
    mkQuote('q2', QUOTES[1] ?? 'one day', 730, 390),
  ]
}

const G_ACCEL = 0.42
const AIR = 0.9915
const ANG_D = 0.977
const DRIFT = 0.016
const ULTRA_GROW = 1.06
const ULTRA_MAX = 4.0

function ObjVisual({ obj, ultra }: { obj: PhysObj; ultra: boolean }) {
  const ink   = ultra ? '#00ffcc' : '#1a1916'
  const muted = ultra ? '#ff00ff' : '#78716c'
  const nc    = NEON[Math.abs(obj.id.charCodeAt(0) + obj.id.charCodeAt(1)) % NEON.length] ?? '#ff00ff'

  if (obj.kind === 'chibi') return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/illustrations/chibi-${obj.variant ?? 'happy'}.png`} alt="" draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', filter: ultra ? `drop-shadow(0 0 8px ${nc}) hue-rotate(${obj.x % 360}deg)` : 'none' }}
      />
      {ultra && <div style={{ position: 'absolute', inset: -3, borderRadius: 8, boxShadow: `0 0 18px ${nc}88`, pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 7, borderRadius: '50%', backgroundColor: ultra ? `${nc}40` : 'rgba(0,0,0,0.10)', filter: 'blur(5px)' }} />
    </div>
  )

  if (obj.kind === 'card') return (
    <div style={{ width: '100%', height: '100%', backgroundColor: ultra ? '#0a0010' : '#fff', border: ultra ? `1.5px solid ${nc}` : '1px solid rgba(26,25,22,0.16)', boxShadow: ultra ? `0 0 20px ${nc}66` : '0 3px 12px rgba(0,0,0,0.09)', padding: '10px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ width: '100%', height: 1.5, backgroundColor: ultra ? nc : 'rgba(26,25,22,0.22)' }} />
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12.5, color: ultra ? nc : ink, lineHeight: 1.35 }}>{obj.label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 9, height: 9, border: `1px solid ${ultra ? nc : 'rgba(26,25,22,0.28)'}` }} />
        <div style={{ flex: 1, height: 1, backgroundColor: ultra ? `${nc}44` : 'rgba(26,25,22,0.07)' }} />
      </div>
    </div>
  )

  if (obj.kind === 'coin') return (
    <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: ultra ? '#1a0028' : '#faf5e8', border: ultra ? `2px solid ${nc}` : '2px solid rgba(26,25,22,0.32)', boxShadow: ultra ? `0 0 24px ${nc}, inset 0 0 12px ${nc}44` : '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: ultra ? nc : ink }}>xp</p>
    </div>
  )

  if (obj.kind === 'ball') {
    const sm  = obj.sizeMult ?? 1
    const hue = Math.min((sm - 1) / 6, 1)
    const bc  = ultra ? `hsl(${Math.round(280 - hue * 200)}, 100%, ${50 + hue * 20}%)` : '#f0ece4'
    const gs  = ultra ? Math.round(sm * 14) : 0
    return (
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: bc, border: ultra ? `${Math.round(1.5 + sm)}px solid ${bc}` : '1.5px solid rgba(26,25,22,0.25)', boxShadow: ultra ? `0 0 ${gs}px ${bc}, 0 0 ${gs * 2}px ${bc}88` : '0 3px 10px rgba(0,0,0,0.12)' }} />
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: ultra ? '#000a18' : '#fff', border: ultra ? `1px solid ${nc}88` : '1px solid rgba(26,25,22,0.11)', boxShadow: ultra ? `0 0 12px ${nc}44` : '0 1px 6px rgba(0,0,0,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: ultra ? '"Courier New", monospace' : 'Georgia, serif', fontStyle: ultra ? 'normal' : 'italic', fontSize: 11, color: ultra ? '#00ffcc' : muted, lineHeight: 1.55, textAlign: 'center', whiteSpace: 'pre-line', textShadow: ultra ? '0 0 8px #00ffcc' : 'none' }}>
        {obj.label}
      </p>
    </div>
  )
}

function SandboxGame({ ultra }: { ultra: boolean }) {
  const objsRef      = useRef<Map<string, PhysObj>>(new Map())
  const domRefs      = useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const grabRef      = useRef<{ id: string; offX: number; offY: number; hist: Array<{ x: number; y: number; t: number }> } | null>(null)
  const gravRef      = useRef(true)
  const windRef      = useRef(0)
  const rafRef       = useRef<number>(0)
  const ultraRef     = useRef(ultra)

  useEffect(() => { ultraRef.current = ultra }, [ultra])

  const [objIds, setObjIds] = useState<string[]>([])
  const [gravOn, setGravOn] = useState(true)
  const [wind, setWind]     = useState(0)
  const [hint, setHint]     = useState(true)

  useEffect(() => {
    const scene = makeScene()
    const m = new Map<string, PhysObj>()
    const ids: string[] = []
    for (const o of scene) { m.set(o.id, o); ids.push(o.id) }
    objsRef.current = m
    setObjIds(ids)
    const t = setTimeout(() => setHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => { gravRef.current = gravOn }, [gravOn])
  useEffect(() => { windRef.current = wind }, [wind])

  useEffect(() => {
    const tick = () => {
      const el = containerRef.current
      if (!el) { rafRef.current = requestAnimationFrame(tick); return }
      const bw = el.offsetWidth, bh = el.offsetHeight
      const useGrav = gravRef.current, wf = windRef.current, isUltra = ultraRef.current

      for (const obj of objsRef.current.values()) {
        if (obj.grabbed) continue
        if (useGrav) obj.vy += G_ACCEL * obj.mass
        else { obj.vx += (Math.random() - 0.5) * DRIFT; obj.vy += (Math.random() - 0.5) * DRIFT }
        obj.vx += wf * 0.04; obj.vx *= AIR; obj.vy *= AIR; obj.av *= ANG_D
        obj.x += obj.vx; obj.y += obj.vy; obj.rotation += obj.av
        const sm = obj.sizeMult ?? 1, hw = (obj.w * sm) / 2, hh = (obj.h * sm) / 2
        let wh = false
        if (obj.x - hw < 0)  { obj.x = hw;      obj.vx =  Math.abs(obj.vx) * obj.restitution; obj.av *= -0.45; wh = true }
        if (obj.x + hw > bw) { obj.x = bw - hw; obj.vx = -Math.abs(obj.vx) * obj.restitution; obj.av *= -0.45; wh = true }
        if (obj.y - hh < 0)  { obj.y = hh;      obj.vy =  Math.abs(obj.vy) * obj.restitution; wh = true }
        if (obj.y + hh > bh) { obj.y = bh - hh; obj.vy = -Math.abs(obj.vy) * obj.restitution; obj.vx *= (1 - obj.friction); obj.av *= 0.62; if (Math.abs(obj.vy) < 0.5) obj.vy = 0; wh = true }
        if (isUltra && obj.kind === 'ball' && wh) obj.sizeMult = Math.min((obj.sizeMult ?? 1) * ULTRA_GROW, ULTRA_MAX)
      }

      for (const [id, obj] of objsRef.current) {
        const dom = domRefs.current.get(id)
        if (dom) {
          const sm = obj.sizeMult ?? 1
          dom.style.width  = `${obj.w * sm}px`
          dom.style.height = `${obj.h * sm}px`
          dom.style.transform = `translate(${(obj.x - (obj.w * sm) / 2).toFixed(1)}px, ${(obj.y - (obj.h * sm) / 2).toFixed(1)}px) rotate(${obj.rotation.toFixed(2)}deg)`
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const onObjDown = useCallback((e: React.PointerEvent<HTMLDivElement>, id: string) => {
    e.preventDefault(); e.stopPropagation()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top
    const obj = objsRef.current.get(id)
    if (!obj) return
    obj.grabbed = true; obj.vx = 0; obj.vy = 0; obj.av = 0
    grabRef.current = { id, offX: obj.x - cx, offY: obj.y - cy, hist: [{ x: cx, y: cy, t: Date.now() }] }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
  }, [])

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const gr = grabRef.current
    if (!gr) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top
    const obj = objsRef.current.get(gr.id)
    if (!obj) return
    obj.x = cx + gr.offX; obj.y = cy + gr.offY
    gr.hist.push({ x: cx, y: cy, t: Date.now() })
    if (gr.hist.length > 6) gr.hist.shift()
  }, [])

  const onUp = useCallback(() => {
    const gr = grabRef.current
    if (!gr) return
    const obj = objsRef.current.get(gr.id)
    if (obj) {
      obj.grabbed = false
      const h = gr.hist, first = h[0], last = h[h.length - 1]
      if (first && last) {
        const dt = Math.max((last.t - first.t) / 1000 * 60, 1)
        obj.vx = (last.x - first.x) / dt * 1.9
        obj.vy = (last.y - first.y) / dt * 1.9
        obj.av = obj.vx * 0.05 * (Math.random() > 0.5 ? 1 : -1)
      }
    }
    grabRef.current = null
    if (containerRef.current) containerRef.current.style.cursor = 'default'
  }, [])

  const chaos = useCallback(() => {
    const mult = ultra ? 3 : 1
    for (const obj of objsRef.current.values()) {
      obj.vx = (Math.random() - 0.5) * 24 * mult
      obj.vy = (Math.random() - 0.5) * 24 * mult
      obj.av = (Math.random() - 0.5) * 16 * mult
    }
  }, [ultra])

  const reset = useCallback(() => {
    const scene = makeScene()
    objsRef.current.clear()
    const ids: string[] = []
    for (const o of scene) { objsRef.current.set(o.id, o); ids.push(o.id) }
    setObjIds(ids)
  }, [])

  const addObj = useCallback((kind: 'chibi' | 'ball' | 'coin') => {
    const bw = containerRef.current?.offsetWidth ?? 800
    const id = `${kind[0]}${Date.now()}`
    let o: PhysObj
    if (kind === 'chibi') {
      const v = CHIBI_IMGS[Math.floor(Math.random() * CHIBI_IMGS.length)] ?? 'happy'
      o = mkChibi(id, v, bw / 2 + (Math.random() - 0.5) * 200, 60)
    } else if (kind === 'ball') {
      o = mkBall(id, bw / 2 + (Math.random() - 0.5) * 300, 60)
    } else {
      o = mkCoin(id, bw / 2 + (Math.random() - 0.5) * 300, 60)
    }
    objsRef.current.set(id, o)
    setObjIds(prev => [...prev, id])
  }, [])

  const ink   = ultra ? '#00ffcc' : '#1a1916'
  const muted = ultra ? '#ff00ff' : '#78716c'
  const faint = ultra ? '#7700ff' : '#a8a29e'

  const btn = (active?: boolean): React.CSSProperties => ({
    fontFamily: ultra ? '"Courier New", monospace' : 'Georgia, serif',
    fontStyle: ultra ? 'normal' : 'italic', fontSize: 12,
    color: active === true ? ink : active === false ? faint : muted,
    backgroundColor: active === true ? (ultra ? 'rgba(0,255,204,0.15)' : 'rgba(26,25,22,0.07)') : 'transparent',
    border: `1px solid ${ultra ? 'rgba(0,255,204,0.25)' : 'rgba(26,25,22,0.12)'}`,
    padding: '5px 13px', cursor: 'pointer', transition: 'all 0.12s',
    textShadow: ultra && active ? '0 0 8px #00ffcc' : 'none',
  })

  return (
    <>
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
      >
        {!ultra && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(26,25,22,0.035) 32px, rgba(26,25,22,0.035) 33px)' }} />}
        {ultra && (
          <>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(0,255,204,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,0.07) 1px, transparent 1px)`, backgroundSize: '48px 48px', animation: 'gridscroll 8s linear infinite' }} />
            <style>{`@keyframes gridscroll{from{background-position:0 0}to{background-position:0 48px}}`}</style>
          </>
        )}

        <p style={{ position: 'absolute', bottom: 20, right: 24, fontFamily: ultra ? '"Courier New", monospace' : 'Georgia, serif', fontStyle: ultra ? 'normal' : 'italic', fontSize: 11, color: ultra ? 'rgba(0,255,204,0.22)' : 'rgba(26,25,22,0.14)', pointerEvents: 'none', letterSpacing: ultra ? '0.14em' : '0.06em' }}>
          {ultra ? '// SANDBOX //' : 'the sandbox'}
        </p>

        <AnimatePresence>
          {hint && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: faint, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {ultra ? '[ DRAG · THROW · CHAOS ]' : 'grab anything · throw it · flip gravity'}
            </motion.p>
          )}
        </AnimatePresence>

        {objIds.map(id => {
          const obj = objsRef.current.get(id)
          if (!obj) return null
          const sm = obj.sizeMult ?? 1
          return (
            <div key={id}
              ref={el => { if (el) domRefs.current.set(id, el); else domRefs.current.delete(id) }}
              style={{ position: 'absolute', top: 0, left: 0, width: obj.w * sm, height: obj.h * sm, willChange: 'transform, width, height', cursor: 'grab', touchAction: 'none', userSelect: 'none', transform: `translate(${obj.x - (obj.w * sm) / 2}px, ${obj.y - (obj.h * sm) / 2}px) rotate(${obj.rotation}deg)` }}
              onPointerDown={e => onObjDown(e, id)}
            >
              <ObjVisual obj={obj} ultra={ultra} />
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div style={{ height: 52, flexShrink: 0, borderTop: `1px solid ${ultra ? 'rgba(0,255,204,0.15)' : 'rgba(26,25,22,0.08)'}`, backgroundColor: ultra ? '#020010' : '#fff', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px' }}>
        <button onClick={() => setGravOn(v => !v)} style={btn(gravOn)}>
          {ultra ? (gravOn ? 'GRAVITY: ON' : 'GRAVITY: OFF') : `gravity ${gravOn ? 'on' : 'off'}`}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 2 }}>
          <span style={{ fontFamily: ultra ? '"Courier New", monospace' : 'Georgia, serif', fontStyle: ultra ? 'normal' : 'italic', fontSize: 11, color: faint }}>{ultra ? 'WIND' : 'wind'}</span>
          <input type="range" min={-2} max={2} step={0.1} value={wind} onChange={e => setWind(Number(e.target.value))} style={{ width: 80, accentColor: ultra ? '#00ffcc' : ink, cursor: 'pointer' }} />
          {wind !== 0 && <button onClick={() => setWind(0)} style={{ fontSize: 10, color: faint, background: 'none', border: 'none', cursor: 'pointer', fontFamily: ultra ? '"Courier New", monospace' : 'Georgia, serif', fontStyle: ultra ? 'normal' : 'italic', padding: 0 }}>{ultra ? 'CALM' : 'calm'}</button>}
        </div>
        <div style={{ width: 1, height: 16, backgroundColor: ultra ? 'rgba(0,255,204,0.15)' : 'rgba(26,25,22,0.10)', margin: '0 4px' }} />
        <button onClick={chaos} style={btn()}>chaos</button>
        <button onClick={reset} style={btn()}>reset</button>
        <div style={{ width: 1, height: 16, backgroundColor: ultra ? 'rgba(0,255,204,0.15)' : 'rgba(26,25,22,0.10)', margin: '0 4px' }} />
        <span style={{ fontFamily: ultra ? '"Courier New", monospace' : 'Georgia, serif', fontStyle: ultra ? 'normal' : 'italic', fontSize: 11, color: faint }}>drop</span>
        <button onClick={() => addObj('chibi')} style={btn()}>chibi</button>
        <button onClick={() => addObj('ball')}  style={btn()}>ball</button>
        <button onClick={() => addObj('coin')}  style={btn()}>coin</button>
        {ultra && <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: '"Courier New", monospace', color: 'rgba(255,0,255,0.45)', letterSpacing: '0.08em' }}>{objIds.length} objects</span>}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BREAK ROOM  — main component
// ═══════════════════════════════════════════════════════════════════════════════

type Mode = 'sprint' | 'sandbox'

export function PlaygroundClient() {
  const { ultraMode } = useADHD()
  const [mode, setMode] = useState<Mode>('sprint')

  const ink   = ultraMode ? '#00ffcc' : '#1a1916'
  const faint = ultraMode ? 'rgba(0,255,204,0.35)' : 'rgba(26,25,22,0.30)'

  return (
    <div style={{
      height: 'calc(100dvh - 4.5rem)',
      display: 'flex', flexDirection: 'column',
      background: ultraMode ? 'linear-gradient(135deg, #05001a 0%, #0a0028 40%, #000d18 100%)' : '#faf9f7',
      overflow: 'hidden', transition: 'background 0.5s',
    }}>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, height: 48,
        display: 'flex', alignItems: 'stretch',
        borderBottom: `1px solid ${ultraMode ? 'rgba(0,255,204,0.12)' : 'rgba(26,25,22,0.08)'}`,
        backgroundColor: ultraMode ? '#020010' : '#fff',
        padding: '0 20px', gap: 2,
      }}>
        {(['sprint', 'sandbox'] as Mode[]).map(m => {
          const active = mode === m
          return (
            <button key={m} onClick={() => setMode(m)} style={{
              fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
              fontStyle: ultraMode ? 'normal' : 'italic',
              fontSize: 12.5, padding: '0 16px', background: 'none', cursor: 'pointer',
              color: active ? ink : faint,
              borderBottom: `2px solid ${active ? ink : 'transparent'}`,
              transition: 'all 0.14s',
              letterSpacing: ultraMode ? '0.08em' : '0',
              textShadow: ultraMode && active ? `0 0 10px ${ink}` : 'none',
            }}>
              {ultraMode
                ? (m === 'sprint' ? '[ SPRINT ]' : '[ SANDBOX ]')
                : (m === 'sprint' ? 'Chibi Sprint' : 'Sandbox')}
            </button>
          )
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <p style={{
            fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
            fontStyle: ultraMode ? 'normal' : 'italic',
            fontSize: 10.5, color: faint, letterSpacing: ultraMode ? '0.12em' : '0.04em',
          }}>
            {ultraMode ? '// BREAK ROOM //' : 'break room'}
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={mode}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {mode === 'sprint'
            ? <SprintGame ultra={ultraMode} />
            : <SandboxGame ultra={ultraMode} />
          }
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
