'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useADHD } from '@/lib/adhd-context'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  // Ultra ADHD: ball growth + explosion tracking
  bounces?: number
  sizeMult?: number   // visual scale multiplier (starts at 1, grows to 3 then BOOM)
}

// ─── Scene data ───────────────────────────────────────────────────────────────

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

// Neon palette for ultra mode
const NEON = ['#ff00ff', '#00ffff', '#ff3300', '#aaff00', '#ff9900', '#00ff88', '#ff0077', '#7700ff']

// ─── Object factories ─────────────────────────────────────────────────────────

function mkChibi(id: string, variant: string, x: number, y: number): PhysObj {
  return {
    id, x, y, vx: (Math.random() - 0.5) * 3, vy: -4,
    w: 88, h: 108, mass: 1, restitution: 0.52, friction: 0.05,
    rotation: (Math.random() - 0.5) * 12, av: (Math.random() - 0.5) * 2.5,
    grabbed: false, kind: 'chibi', variant,
  }
}

function mkCard(id: string, label: string, x: number, y: number): PhysObj {
  return {
    id, x, y, vx: (Math.random() - 0.5) * 2, vy: -1.5,
    w: 140, h: 80, mass: 0.8, restitution: 0.28, friction: 0.08,
    rotation: (Math.random() - 0.5) * 9, av: (Math.random() - 0.5) * 1.8,
    grabbed: false, kind: 'card', label,
  }
}

function mkCoin(id: string, x: number, y: number): PhysObj {
  return {
    id, x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 2,
    w: 54, h: 54, mass: 0.45, restitution: 0.75, friction: 0.02,
    rotation: Math.random() * 360, av: (Math.random() - 0.5) * 5,
    grabbed: false, kind: 'coin',
  }
}

function mkBall(id: string, x: number, y: number, vx?: number, vy?: number): PhysObj {
  return {
    id, x, y,
    vx: vx ?? (Math.random() - 0.5) * 6,
    vy: vy ?? -3,
    w: 46, h: 46, mass: 0.6, restitution: 0.82, friction: 0.01,
    rotation: 0, av: (Math.random() - 0.5) * 4,
    grabbed: false, kind: 'ball',
    bounces: 0, sizeMult: 1,
  }
}

function mkQuote(id: string, label: string, x: number, y: number): PhysObj {
  return {
    id, x, y, vx: (Math.random() - 0.5) * 1.5, vy: -0.5,
    w: 172, h: 68, mass: 0.65, restitution: 0.3, friction: 0.1,
    rotation: (Math.random() - 0.5) * 5, av: (Math.random() - 0.5) * 1,
    grabbed: false, kind: 'quote', label,
  }
}

function makeScene(): PhysObj[] {
  return [
    mkChibi('c1', 'happy',  230, 180),
    mkChibi('c2', 'calm',   570, 150),
    mkChibi('c3', 'grumpy', 870, 200),
    mkCard('t1', TASK_LABELS[0] ?? 'Ship it',   330, 300),
    mkCard('t2', TASK_LABELS[1] ?? 'Inbox zero', 620, 260),
    mkCard('t3', TASK_LABELS[2] ?? 'Take a break', 480, 170),
    mkCoin('k1', 160, 360),
    mkCoin('k2', 410, 330),
    mkCoin('k3', 700, 280),
    mkCoin('k4', 940, 350),
    mkBall('b1', 290, 120),
    mkBall('b2', 750, 90),
    mkQuote('q1', QUOTES[0] ?? 'keep going', 280, 420),
    mkQuote('q2', QUOTES[1] ?? 'one day',    730, 390),
  ]
}

// ─── Physics constants ────────────────────────────────────────────────────────

const G_ACCEL  = 0.42
const AIR      = 0.9915
const ANG_D    = 0.977
const DRIFT    = 0.016

// Ultra: ball grows on every wall hit, capped at ULTRA_MAX_MULT (no explosion)
const ULTRA_GROW    = 1.06   // 6% bigger per wall hit
const ULTRA_MAX_MULT = 4.0   // max visual size multiplier (never explodes)

// ─── Object renderer ─────────────────────────────────────────────────────────

function ObjectVisual({ obj, ultra }: { obj: PhysObj; ultra: boolean }) {
  const ink   = ultra ? '#00ffcc' : '#1a1916'
  const muted = ultra ? '#ff00ff' : '#78716c'
  const neonColor = NEON[Math.abs(obj.id.charCodeAt(0) + obj.id.charCodeAt(1)) % NEON.length] ?? '#ff00ff'

  if (obj.kind === 'chibi') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/illustrations/chibi-${obj.variant ?? 'happy'}.png`}
          alt=""
          style={{
            width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none',
            filter: ultra ? `drop-shadow(0 0 8px ${neonColor}) hue-rotate(${(obj.x % 360)}deg)` : 'none',
          }}
          draggable={false}
        />
        {ultra && (
          <div style={{
            position: 'absolute', inset: -3, borderRadius: 8,
            boxShadow: `0 0 18px ${neonColor}88`,
            pointerEvents: 'none',
          }} />
        )}
        <div style={{
          position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
          width: '60%', height: 7, borderRadius: '50%',
          backgroundColor: ultra ? `${neonColor}40` : 'rgba(0,0,0,0.10)', filter: 'blur(5px)',
        }} />
      </div>
    )
  }

  if (obj.kind === 'card') {
    return (
      <div style={{
        width: '100%', height: '100%',
        backgroundColor: ultra ? '#0a0010' : '#fff',
        border: ultra ? `1.5px solid ${neonColor}` : '1px solid rgba(26,25,22,0.16)',
        boxShadow: ultra ? `0 0 20px ${neonColor}66` : '0 3px 12px rgba(0,0,0,0.09)',
        padding: '10px 13px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{ width: '100%', height: 1.5, backgroundColor: ultra ? neonColor : 'rgba(26,25,22,0.22)' }} />
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12.5, color: ultra ? neonColor : ink, lineHeight: 1.35 }}>
          {obj.label}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 9, height: 9, border: `1px solid ${ultra ? neonColor : 'rgba(26,25,22,0.28)'}` }} />
          <div style={{ flex: 1, height: 1, backgroundColor: ultra ? `${neonColor}44` : 'rgba(26,25,22,0.07)' }} />
        </div>
      </div>
    )
  }

  if (obj.kind === 'coin') {
    return (
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        backgroundColor: ultra ? '#1a0028' : '#faf5e8',
        border: ultra ? `2px solid ${neonColor}` : '2px solid rgba(26,25,22,0.32)',
        boxShadow: ultra
          ? `0 0 24px ${neonColor}, inset 0 0 12px ${neonColor}44`
          : '0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: ultra ? neonColor : ink }}>xp</p>
      </div>
    )
  }

  if (obj.kind === 'ball') {
    const mult = obj.sizeMult ?? 1
    const hue  = Math.min((mult - 1) / 6, 1)   // 0→1 as sizeMult grows from 1 to ~7
    const ballColor = ultra
      ? `hsl(${Math.round(280 - hue * 200)}, 100%, ${50 + hue * 20}%)`
      : '#f0ece4'
    const glowSize = ultra ? Math.round(mult * 14) : 0

    return (
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        backgroundColor: ballColor,
        border: ultra ? `${Math.round(1.5 + mult)}px solid ${ballColor}` : '1.5px solid rgba(26,25,22,0.25)',
        boxShadow: ultra
          ? `0 0 ${glowSize}px ${ballColor}, 0 0 ${glowSize * 2}px ${ballColor}88`
          : '0 3px 10px rgba(0,0,0,0.12), inset 0 -2px 4px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.5)',
      }} />
    )
  }

  // quote
  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: ultra ? '#000a18' : '#fff',
      border: ultra ? `1px solid ${neonColor}88` : '1px solid rgba(26,25,22,0.11)',
      boxShadow: ultra ? `0 0 12px ${neonColor}44` : '0 1px 6px rgba(0,0,0,0.06)',
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{
        fontFamily: ultra ? '"Courier New", monospace' : 'Georgia, serif',
        fontStyle: ultra ? 'normal' : 'italic',
        fontSize: 11, color: ultra ? '#00ffcc' : muted, lineHeight: 1.55,
        textAlign: 'center', whiteSpace: 'pre-line',
        textShadow: ultra ? '0 0 8px #00ffcc' : 'none',
      }}>
        {obj.label}
      </p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PlaygroundClient() {
  const { ultraMode } = useADHD()

  const objsRef      = useRef<Map<string, PhysObj>>(new Map())
  const domRefs      = useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const grabRef      = useRef<{
    id: string
    offX: number; offY: number
    hist: Array<{ x: number; y: number; t: number }>
  } | null>(null)
  const gravRef     = useRef(true)
  const windRef     = useRef(0)
  const rafRef      = useRef<number>(0)
  const ultraRef    = useRef(ultraMode)

  useEffect(() => { ultraRef.current = ultraMode }, [ultraMode])

  const [objIds, setObjIds] = useState<string[]>([])
  const [gravOn, setGravOn] = useState(true)
  const [wind, setWind]     = useState(0)
  const [hint, setHint]     = useState(true)

  // Init
  useEffect(() => {
    const scene = makeScene()
    const m = new Map<string, PhysObj>()
    const ids: string[] = []
    for (const o of scene) { m.set(o.id, o); ids.push(o.id) }
    objsRef.current = m
    setObjIds(ids)
    const t = setTimeout(() => setHint(false), 4500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => { gravRef.current = gravOn }, [gravOn])
  useEffect(() => { windRef.current = wind }, [wind])

  // Physics loop
  useEffect(() => {
    const tick = () => {
      const el = containerRef.current
      if (!el) { rafRef.current = requestAnimationFrame(tick); return }
      const bw = el.offsetWidth
      const bh = el.offsetHeight
      const useGrav = gravRef.current
      const wf      = windRef.current
      const isUltra = ultraRef.current

      for (const obj of objsRef.current.values()) {
        if (obj.grabbed) continue

        if (useGrav) {
          obj.vy += G_ACCEL * obj.mass
        } else {
          obj.vx += (Math.random() - 0.5) * DRIFT
          obj.vy += (Math.random() - 0.5) * DRIFT
        }

        obj.vx += wf * 0.04
        obj.vx *= AIR
        obj.vy *= AIR
        obj.av *= ANG_D

        obj.x += obj.vx
        obj.y += obj.vy
        obj.rotation += obj.av

        const sm  = obj.sizeMult ?? 1
        const hw  = (obj.w * sm) / 2
        const hh  = (obj.h * sm) / 2
        let wallHit = false

        if (obj.x - hw < 0)   { obj.x = hw;      obj.vx =  Math.abs(obj.vx) * obj.restitution; obj.av *= -0.45; wallHit = true }
        if (obj.x + hw > bw)  { obj.x = bw - hw; obj.vx = -Math.abs(obj.vx) * obj.restitution; obj.av *= -0.45; wallHit = true }
        if (obj.y - hh < 0)   { obj.y = hh;      obj.vy =  Math.abs(obj.vy) * obj.restitution; wallHit = true }
        if (obj.y + hh > bh) {
          obj.y = bh - hh
          obj.vy = -Math.abs(obj.vy) * obj.restitution
          obj.vx *= (1 - obj.friction)
          obj.av *= 0.62
          if (Math.abs(obj.vy) < 0.5) obj.vy = 0
          wallHit = true
        }

        // Ultra ADHD: balls grow on wall hit, capped — no explosion
        if (isUltra && obj.kind === 'ball' && wallHit) {
          obj.sizeMult = Math.min((obj.sizeMult ?? 1) * ULTRA_GROW, ULTRA_MAX_MULT)
        }
      }

      // Write positions to DOM
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

  // Drag — pointer down on object
  const onObjDown = useCallback((e: React.PointerEvent<HTMLDivElement>, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const obj = objsRef.current.get(id)
    if (!obj) return
    obj.grabbed = true
    obj.vx = 0; obj.vy = 0; obj.av = 0
    grabRef.current = { id, offX: obj.x - cx, offY: obj.y - cy, hist: [{ x: cx, y: cy, t: Date.now() }] }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    container.style.cursor = 'grabbing'
  }, [])

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const gr = grabRef.current
    if (!gr) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const obj = objsRef.current.get(gr.id)
    if (!obj) return
    obj.x = cx + gr.offX
    obj.y = cy + gr.offY
    gr.hist.push({ x: cx, y: cy, t: Date.now() })
    if (gr.hist.length > 6) gr.hist.shift()
  }, [])

  const onUp = useCallback(() => {
    const gr = grabRef.current
    if (!gr) return
    const obj = objsRef.current.get(gr.id)
    if (obj) {
      obj.grabbed = false
      const h = gr.hist
      const first = h[0]; const last = h[h.length - 1]
      if (first && last) {
        const dt = Math.max((last.t - first.t) / 1000 * 60, 1)
        obj.vx = (last.x - first.x) / dt * 1.9
        obj.vy = (last.y - first.y) / dt * 1.9
        obj.av = obj.vx * 0.05 * (Math.random() > 0.5 ? 1 : -1)
      }
    }
    grabRef.current = null
    const container = containerRef.current
    if (container) container.style.cursor = 'default'
  }, [])

  // Controls
  const chaos = useCallback(() => {
    const mult = ultraMode ? 3 : 1
    for (const obj of objsRef.current.values()) {
      obj.vx = (Math.random() - 0.5) * 24 * mult
      obj.vy = (Math.random() - 0.5) * 24 * mult
      obj.av = (Math.random() - 0.5) * 16 * mult
    }
  }, [ultraMode])

  const reset = useCallback(() => {
    const scene = makeScene()
    objsRef.current.clear()
    const ids: string[] = []
    for (const o of scene) { objsRef.current.set(o.id, o); ids.push(o.id) }
    setObjIds(ids)
  }, [])

  const addChibi = useCallback(() => {
    const v = CHIBI_IMGS[Math.floor(Math.random() * CHIBI_IMGS.length)] ?? 'happy'
    const id = `c${Date.now()}`
    const bw = containerRef.current?.offsetWidth ?? 800
    const o = mkChibi(id, v, bw / 2 + (Math.random() - 0.5) * 200, 60)
    objsRef.current.set(id, o)
    setObjIds((prev) => [...prev, id])
  }, [])

  const addBall = useCallback(() => {
    const id = `b${Date.now()}`
    const bw = containerRef.current?.offsetWidth ?? 800
    const o = mkBall(id, bw / 2 + (Math.random() - 0.5) * 300, 60)
    objsRef.current.set(id, o)
    setObjIds((prev) => [...prev, id])
  }, [])

  const addCoin = useCallback(() => {
    const id = `k${Date.now()}`
    const bw = containerRef.current?.offsetWidth ?? 800
    const o = mkCoin(id, bw / 2 + (Math.random() - 0.5) * 300, 60)
    objsRef.current.set(id, o)
    setObjIds((prev) => [...prev, id])
  }, [])

  // ─── Styles: ultra or normal ──────────────────────────────────────────────

  const canvasBg = ultraMode
    ? 'linear-gradient(135deg, #05001a 0%, #0a0028 40%, #000d18 100%)'
    : 'var(--paper-warm, #faf9f7)'

  const ink   = ultraMode ? '#00ffcc' : '#1a1916'
  const muted = ultraMode ? '#ff00ff' : '#78716c'
  const faint = ultraMode ? '#7700ff' : '#a8a29e'

  const btn = (active?: boolean): React.CSSProperties => ({
    fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
    fontStyle: ultraMode ? 'normal' : 'italic',
    fontSize: 12,
    color: active === true ? ink : active === false ? faint : muted,
    backgroundColor: active === true
      ? (ultraMode ? 'rgba(0,255,204,0.15)' : 'rgba(26,25,22,0.07)')
      : 'transparent',
    border: `1px solid ${ultraMode ? 'rgba(0,255,204,0.25)' : 'rgba(26,25,22,0.12)'}`,
    padding: '5px 13px', cursor: 'pointer', transition: 'all 0.12s',
    textShadow: ultraMode && active ? '0 0 8px #00ffcc' : 'none',
  })

  return (
    <div style={{
      height: 'calc(100dvh - 4.5rem)',
      display: 'flex', flexDirection: 'column',
      background: canvasBg,
      overflow: 'hidden',
      transition: 'background 0.6s ease',
    }}>

      {/* ── Canvas ────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {/* Normal: paper line texture */}
        {!ultraMode && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(26,25,22,0.035) 32px, rgba(26,25,22,0.035) 33px)',
          }} />
        )}

        {/* Ultra: animated neon grid */}
        {ultraMode && (
          <>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: `
                linear-gradient(rgba(0,255,204,0.07) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,204,0.07) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
              animation: 'gridscroll 8s linear infinite',
            }} />
            <style>{`
              @keyframes gridscroll { from { background-position: 0 0; } to { background-position: 0 48px; } }
              @keyframes scanline { 0%,100%{opacity:0.04} 50%{opacity:0.09} }
            `}</style>
            {/* Scanlines */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,204,0.03) 3px, rgba(0,255,204,0.03) 4px)',
              animation: 'scanline 3s ease-in-out infinite',
            }} />
          </>
        )}

        {/* Corner label */}
        <p style={{
          position: 'absolute', bottom: 20, right: 24,
          fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
          fontStyle: ultraMode ? 'normal' : 'italic',
          fontSize: 11,
          color: ultraMode ? 'rgba(0,255,204,0.25)' : 'rgba(26,25,22,0.15)',
          pointerEvents: 'none',
          letterSpacing: ultraMode ? '0.14em' : '0.06em',
          textShadow: ultraMode ? '0 0 8px rgba(0,255,204,0.4)' : 'none',
        }}>
          {ultraMode ? '// ULTRA MODE //' : 'the playground'}
        </p>

        {/* Gravity indicator */}
        <AnimatePresence>
          {!gravOn && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{
                position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
                fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
                fontStyle: ultraMode ? 'normal' : 'italic',
                fontSize: 11, color: faint, pointerEvents: 'none', whiteSpace: 'nowrap',
                letterSpacing: '0.08em',
                textShadow: ultraMode ? `0 0 12px ${faint}` : 'none',
              }}
            >
              {ultraMode ? '[ ZERO GRAVITY ENGAGED ]' : 'zero gravity'}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Ultra hint */}
        <AnimatePresence>
          {ultraMode && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
                fontFamily: '"Courier New", monospace', fontSize: 11,
                color: 'rgba(255,0,255,0.6)', pointerEvents: 'none', whiteSpace: 'nowrap',
                letterSpacing: '0.10em',
                textShadow: '0 0 10px rgba(255,0,255,0.5)',
              }}
            >
              {'> BALLS GROW ON BOUNCE · EXPLODE INTO 50 ·'}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Hint */}
        <AnimatePresence>
          {hint && !ultraMode && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: 12, color: faint, pointerEvents: 'none', whiteSpace: 'nowrap',
              }}
            >
              grab anything · throw it · flip gravity
            </motion.p>
          )}
        </AnimatePresence>

        {/* Physics objects */}
        {objIds.map((id) => {
          const obj = objsRef.current.get(id)
          if (!obj) return null
          const sm = obj.sizeMult ?? 1
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) { domRefs.current.set(id, el) }
                else { domRefs.current.delete(id) }
              }}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: obj.w * sm, height: obj.h * sm,
                willChange: 'transform, width, height',
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
                transform: `translate(${obj.x - (obj.w * sm) / 2}px, ${obj.y - (obj.h * sm) / 2}px) rotate(${obj.rotation}deg)`,
              }}
              onPointerDown={(e) => onObjDown(e, id)}
            >
              <ObjectVisual obj={obj} ultra={ultraMode} />
            </div>
          )
        })}
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{
        height: 56, flexShrink: 0,
        borderTop: `1px solid ${ultraMode ? 'rgba(0,255,204,0.15)' : 'rgba(26,25,22,0.08)'}`,
        backgroundColor: ultraMode ? '#020010' : 'var(--paper, #fff)',
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px',
      }}>
        {/* Gravity */}
        <button onClick={() => setGravOn((v) => !v)} style={btn(gravOn)}>
          {ultraMode ? (gravOn ? 'GRAVITY: ON' : 'GRAVITY: OFF') : `gravity ${gravOn ? 'on' : 'off'}`}
        </button>

        {/* Wind */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 4 }}>
          <span style={{
            fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
            fontStyle: ultraMode ? 'normal' : 'italic',
            fontSize: 11, color: faint,
          }}>
            {ultraMode ? 'WIND' : 'wind'}
          </span>
          <input
            type="range" min={-2} max={2} step={0.1} value={wind}
            onChange={(e) => setWind(Number(e.target.value))}
            style={{ width: 86, accentColor: ultraMode ? '#00ffcc' : ink, cursor: 'pointer' }}
          />
          {wind !== 0 && (
            <button
              onClick={() => setWind(0)}
              style={{
                fontSize: 10, color: faint, background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
                fontStyle: ultraMode ? 'normal' : 'italic', padding: 0,
              }}
            >
              {ultraMode ? 'CALM' : 'calm'}
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 18, backgroundColor: ultraMode ? 'rgba(0,255,204,0.15)' : 'rgba(26,25,22,0.10)', margin: '0 6px' }} />

        <button onClick={chaos} style={btn()}>
          {ultraMode ? 'CHAOS' : 'chaos'}
        </button>
        <button onClick={reset} style={btn()}>
          {ultraMode ? 'RESET' : 'reset'}
        </button>

        <div style={{ width: 1, height: 18, backgroundColor: ultraMode ? 'rgba(0,255,204,0.15)' : 'rgba(26,25,22,0.10)', margin: '0 6px' }} />

        <span style={{
          fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
          fontStyle: ultraMode ? 'normal' : 'italic',
          fontSize: 11, color: faint,
        }}>
          {ultraMode ? 'DROP:' : 'drop'}
        </span>
        <button onClick={addChibi} style={btn()}>chibi</button>
        <button onClick={addBall}  style={btn()}>
          ball
        </button>
        <button onClick={addCoin}  style={btn()}>coin</button>

        {ultraMode && (
          <span style={{
            marginLeft: 'auto', fontSize: 10,
            fontFamily: '"Courier New", monospace',
            color: 'rgba(255,0,255,0.50)',
            letterSpacing: '0.08em',
          }}>
            {objIds.length} objects
          </span>
        )}
      </div>
    </div>
  )
}
