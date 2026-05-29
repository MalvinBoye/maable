'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useADHD } from '@/lib/adhd-context'

// ─── On-brand ink palette ─────────────────────────────────────────────────────

const INK = [
  'rgba(26,25,22,0.70)',
  'rgba(26,25,22,0.45)',
  'rgba(26,25,22,0.28)',
  'rgba(87,83,78,0.55)',
  'rgba(120,113,108,0.50)',
  '#c9a84c',
  '#c9a84c',
  '#c9a84c',
]

const MARKS = ['·', '✦', '◆', '○', '✧', '×', '◇', '·', '·']

// ─── Sound ────────────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) { try { audioCtx = new AudioContext() } catch { return null } }
  return audioCtx
}

function tone(freq: number, dur: number, vol = 0.045, type: OscillatorType = 'sine', delay = 0) {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = type; osc.frequency.value = freq
  gain.gain.setValueAtTime(0, ctx.currentTime + delay)
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur)
  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + dur + 0.01)
}

export function playClick() {
  tone(520, 0.07, 0.04, 'sine')
  tone(720, 0.05, 0.02, 'sine', 0.04)
}

export function playType() {
  const ctx = getCtx()
  if (!ctx) return
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.025, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / d.length) * 0.025
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900
  src.connect(f); f.connect(ctx.destination); src.start()
}

export function playSuccess() {
  const notes = [440, 554, 659, 880]
  notes.forEach((freq, i) => tone(freq, 0.16, 0.04, 'sine', i * 0.085))
}

export function playNav() {
  tone(420, 0.10, 0.035, 'sine')
  tone(528, 0.10, 0.025, 'sine', 0.04)
}

function playComboMilestone(combo: number) {
  const mult = Math.min(combo / 10, 3)
  tone(330 + combo * 4, 0.12, 0.05 * mult, 'sine')
  tone(440 + combo * 6, 0.10, 0.03 * mult, 'sine', 0.06)
  if (combo >= 20) tone(660, 0.18, 0.04, 'sine', 0.12)
}

// ─── Ink-splat burst ──────────────────────────────────────────────────────────
// In ADHD mode: bigger, faster, more particles

function inkBurst(x: number, y: number, count = 14) {
  const layer = document.getElementById('adhd-sparkle-layer')
  if (!layer) return

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    const color = INK[Math.floor(Math.random() * INK.length)]!
    const size = 4 + Math.random() * 10
    const angle = Math.PI * 2 * (i / count) + (Math.random() - 0.5) * 1.5
    const speed = 50 + Math.random() * 110
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed

    el.style.cssText = `
      position:absolute;
      left:${x}px;top:${y}px;
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:${Math.random() > 0.4 ? '50%' : '2px'};
      pointer-events:none;
    `
    el.animate([
      { transform: `translate(-50%,-50%)`, opacity: 0.9 },
      { transform: `translate(calc(-50% + ${vx}px),calc(-50% + ${vy}px)) scale(0)`, opacity: 0 },
    ], {
      duration: 350 + Math.random() * 280,
      easing: 'cubic-bezier(.2,.8,.3,1)',
      fill: 'forwards',
    }).onfinish = () => el.remove()

    layer.appendChild(el)
  }
}

// ─── Element shake (individual click jolt) ────────────────────────────────────

function elementShake(el: HTMLElement) {
  const a = 8
  el.animate([
    { transform: 'translate(0,0) rotate(0deg)' },
    { transform: `translate(${(Math.random()-0.5)*a*2}px,${(Math.random()-0.5)*a}px) rotate(${(Math.random()-0.5)*5}deg)` },
    { transform: `translate(${(Math.random()-0.5)*a*1.5}px,${(Math.random()-0.5)*a}px) rotate(${(Math.random()-0.5)*4}deg)` },
    { transform: `translate(${(Math.random()-0.5)*a*0.7}px,0) rotate(0deg)` },
    { transform: 'translate(0,0) rotate(0deg)' },
  ], { duration: 260, easing: 'ease-out' })
}

// ─── Hover jolt (in-your-face scale) ─────────────────────────────────────────

function hoverIn(el: HTMLElement) {
  el.getAnimations().filter(a => a.id === 'adhd-h').forEach(a => a.cancel())
  const tilt = (Math.random() - 0.5) * 5
  el.animate([
    { transform: 'scale(1) translateY(0) rotate(0deg)' },
    { transform: `scale(1.13) translateY(-6px) rotate(${tilt}deg)` },
  ], { duration: 180, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards', id: 'adhd-h' } as KeyframeAnimationOptions)
}

function hoverOut(el: HTMLElement) {
  el.getAnimations().filter(a => a.id === 'adhd-h').forEach(a => a.cancel())
  el.animate([
    { transform: 'scale(1) translateY(0) rotate(0deg)' },
  ], { duration: 220, easing: 'ease-out', fill: 'forwards', id: 'adhd-h' } as KeyframeAnimationOptions)
}

// ─── Typed key display (ridiculous_coding style — exaggerated in ADHD mode) ──

function showTypedKey(key: string, combo: number) {
  const KEY_NAMES: Record<string, string> = {
    ' ': 'space', Enter: '↵', Backspace: '⌫', Tab: 'tab',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  }
  const display = KEY_NAMES[key] ?? (key.length === 1 ? key : null)
  if (!display) return

  const active = document.activeElement as HTMLElement | null
  let x = window.innerWidth * 0.5
  let y = window.innerHeight * 0.4
  if (active && active !== document.body) {
    const rect = active.getBoundingClientRect()
    x = rect.left + Math.random() * Math.min(rect.width * 0.7, 180) + rect.width * 0.1
    y = rect.top + rect.height * 0.2 + Math.random() * rect.height * 0.4
  }

  const color = combo >= 20 ? '#c9a84c'
    : combo >= 10 ? 'rgba(201,168,76,0.90)'
    : combo >= 5 ? 'rgba(87,83,78,0.90)'
    : 'rgba(26,25,22,0.72)'

  const isWord = display.length > 1
  // Scale up with combo — ADHD mode is deliberately over the top
  const baseSize = isWord ? 0.90 : 2.1
  const comboScale = 1 + Math.min(combo / 40, 0.8)
  const el = document.createElement('div')
  el.textContent = display.toUpperCase()
  el.style.cssText = `
    position:fixed;
    left:${x}px;top:${y}px;
    font-family:Georgia,serif;
    font-style:italic;
    font-weight:bold;
    font-size:${baseSize * comboScale}rem;
    letter-spacing:${isWord ? '0.14em' : '0'};
    color:${color};
    pointer-events:none;
    z-index:9999;
    user-select:none;
    white-space:nowrap;
    text-shadow:0 2px 12px rgba(26,25,22,0.18);
  `
  document.body.appendChild(el)

  // More drift and float than before
  const fx = (Math.random() - 0.5) * 70
  const fy = -(70 + Math.random() * 60)
  const rot = (Math.random() - 0.5) * 16

  el.animate([
    { transform: `translate(-50%,-50%) scale(${combo >= 10 ? 1.3 : 1}) rotate(0deg)`, opacity: 1 },
    { transform: `translate(calc(-50% + ${fx}px), calc(-50% + ${fy}px)) scale(0.4) rotate(${rot}deg)`, opacity: 0 },
  ], {
    duration: 750 + Math.random() * 250,
    easing: 'cubic-bezier(0.2,0.8,0.3,1)',
    fill: 'forwards',
  }).onfinish = () => el.remove()
}

// ─── Combo milestone mega-burst ────────────────────────────────────────────────

function comboBurst(x: number, y: number, combo: number) {
  const layer = document.getElementById('adhd-sparkle-layer')
  if (!layer) return
  const count = Math.min(10 + combo, 38)
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    const isGold = Math.random() > 0.4 || combo >= 20
    const color = isGold ? '#c9a84c' : INK[Math.floor(Math.random() * INK.length)]!
    const size = 4 + Math.random() * 12
    const angle = Math.PI * 2 * (i / count) + (Math.random() - 0.5) * 0.8
    const speed = 80 + Math.random() * (100 + combo * 3)
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed

    el.style.cssText = `
      position:absolute;left:${x}px;top:${y}px;
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:${Math.random() > 0.3 ? '50%' : '2px'};
      pointer-events:none;
    `
    el.animate([
      { transform: `translate(-50%,-50%) scale(1)`, opacity: 1 },
      { transform: `translate(calc(-50% + ${vx}px),calc(-50% + ${vy}px)) scale(0)`, opacity: 0 },
    ], {
      duration: 500 + Math.random() * 400,
      easing: 'cubic-bezier(.1,.9,.2,1)',
      fill: 'forwards',
    }).onfinish = () => el.remove()
    layer.appendChild(el)
  }
}

// ─── Screen shake — stronger in ADHD mode ────────────────────────────────────

function triggerShake(intensity: number) {
  const amp = Math.min(3 + intensity * 0.5, 12)
  document.documentElement.animate([
    { transform: 'translate(0,0)' },
    { transform: `translate(${-amp}px,${amp * 0.5}px)` },
    { transform: `translate(${amp * 0.9}px,${-amp * 0.4}px)` },
    { transform: `translate(${-amp * 0.6}px,${amp * 0.6}px)` },
    { transform: `translate(${amp * 0.35}px,${-amp * 0.2}px)` },
    { transform: 'translate(0,0)' },
  ], { duration: 260, easing: 'ease-out' })
}

// ─── Flash overlay ────────────────────────────────────────────────────────────

function triggerFlash(combo: number) {
  const el = document.createElement('div')
  const isLegendary = combo >= 50
  el.style.cssText = `
    position:fixed;inset:0;
    background:${isLegendary ? 'rgba(201,168,76,0.14)' : 'rgba(26,25,22,0.10)'};
    pointer-events:none;z-index:9995;
  `
  document.body.appendChild(el)
  el.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 240,
    easing: 'ease-out',
    fill: 'forwards',
  }).onfinish = () => el.remove()
}

// ─── Ink mark float ───────────────────────────────────────────────────────────

export function typeSpark(x: number, y: number) {
  const layer = document.getElementById('adhd-sparkle-layer')
  if (!layer) return

  const mark = MARKS[Math.floor(Math.random() * MARKS.length)]!
  const el = document.createElement('div')
  const color = INK[Math.floor(Math.random() * INK.length)]!

  el.textContent = mark
  el.style.cssText = `
    position:absolute;left:${x}px;top:${y}px;
    font-size:${10 + Math.random() * 10}px;color:${color};
    pointer-events:none;font-family:Georgia,serif;user-select:none;
  `
  el.animate([
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.85 },
    { transform: `translate(calc(-50% + ${(Math.random() - 0.5) * 22}px),-${22 + Math.random() * 28}px) scale(0.3)`, opacity: 0 },
  ], { duration: 400 + Math.random() * 200, easing: 'ease-out', fill: 'forwards' }).onfinish = () => el.remove()

  layer.appendChild(el)
}

// ─── Ghost ink scramble ───────────────────────────────────────────────────────

const SERIF_MARKS = 'abcdefghijklmnoprstuvwxyz'

export function scrambleGhost(anchorEl: HTMLElement) {
  const rect = anchorEl.getBoundingClientRect()
  const el = document.createElement('div')
  const chars = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () =>
    SERIF_MARKS[Math.floor(Math.random() * SERIF_MARKS.length)]
  ).join('')

  el.textContent = chars
  el.style.cssText = `
    position:fixed;
    left:${rect.left + 8 + Math.random() * Math.min(rect.width * 0.5, 80)}px;
    top:${rect.top + Math.random() * Math.min(rect.height, 60)}px;
    font-family:Georgia,serif;font-style:italic;
    font-size:${11 + Math.random() * 6}px;
    color:rgba(26,25,22,0.22);pointer-events:none;z-index:9999;user-select:none;
  `
  document.body.appendChild(el)
  el.animate([
    { opacity: 0.22, transform: 'translateY(0)' },
    { opacity: 0, transform: 'translateY(-12px)' },
  ], { duration: 260, easing: 'ease-out', fill: 'forwards' }).onfinish = () => el.remove()
}

// ─── Ink trail ────────────────────────────────────────────────────────────────

let trailTick = 0

function inkTrail(x: number, y: number) {
  trailTick++
  if (trailTick % 3 !== 0) return   // denser trail than before
  const el = document.createElement('div')
  const size = 3 + Math.random() * 3
  el.style.cssText = `
    position:fixed;left:${x - size / 2}px;top:${y - size / 2}px;
    width:${size}px;height:${size}px;border-radius:50%;
    background:rgba(26,25,22,${0.12 + Math.random() * 0.10});
    pointer-events:none;z-index:9998;
  `
  document.body.appendChild(el)
  el.animate([
    { opacity: 1, transform: 'scale(1)' },
    { opacity: 0, transform: 'scale(0)' },
  ], { duration: 380, easing: 'ease-out', fill: 'forwards' }).onfinish = () => el.remove()
}

// ─── Ambient float ────────────────────────────────────────────────────────────

let ambientIntervalId: ReturnType<typeof setInterval> | null = null

function startAmbient() {
  if (ambientIntervalId) return
  ambientIntervalId = setInterval(() => {
    if (!document.body.classList.contains('adhd-mode')) return
    const el = document.createElement('div')
    const mark = MARKS[Math.floor(Math.random() * MARKS.length)]!
    const x = Math.random() * window.innerWidth
    const y = window.innerHeight + 10
    el.textContent = mark
    el.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;
      font-size:${10 + Math.random() * 14}px;font-family:Georgia,serif;
      color:rgba(26,25,22,0.07);pointer-events:none;z-index:9990;user-select:none;
    `
    document.body.appendChild(el)
    el.animate([
      { transform: 'translateY(0) rotate(0deg)', opacity: 0.07 },
      { transform: `translateY(-${100 + Math.random() * 160}px) rotate(${(Math.random() - 0.5) * 30}deg)`, opacity: 0 },
    ], { duration: 3000 + Math.random() * 2000, easing: 'linear', fill: 'forwards' }).onfinish = () => el.remove()
  }, 450)
}

function stopAmbient() {
  if (ambientIntervalId) { clearInterval(ambientIntervalId); ambientIntervalId = null }
}

// ─── Combo counter display ────────────────────────────────────────────────────

const COMBO_MILESTONES = [10, 20, 30, 50, 75, 100]

function ComboDisplay({ combo, maxCombo }: { combo: number; maxCombo: number }) {
  const isRecord = combo > 0 && combo === maxCombo && combo >= 10
  const tier = combo >= 50 ? 'legendary' : combo >= 20 ? 'hot' : combo >= 10 ? 'warm' : 'cool'

  const color = tier === 'legendary' ? '#c9a84c'
    : tier === 'hot' ? 'rgba(201,168,76,0.80)'
    : tier === 'warm' ? 'rgba(26,25,22,0.65)'
    : 'rgba(26,25,22,0.42)'

  const fontSize = tier === 'legendary' ? '3.2rem' : tier === 'hot' ? '2.6rem' : '2rem'

  return (
    <motion.div
      className="fixed pointer-events-none select-none"
      style={{ bottom: 32, right: 32, zIndex: 9994, textAlign: 'right' }}
      initial={{ opacity: 0, scale: 0.7, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 12 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
    >
      <AnimatePresence>
        {COMBO_MILESTONES.includes(combo) && (
          <motion.div
            key={`pulse-${combo}`}
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 3 }}
            transition={{ duration: 0.55 }}
            style={{ border: `2px solid ${color}` }}
          />
        )}
      </AnimatePresence>

      <motion.p
        key={tier}
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 15 }}
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize,
          color,
          lineHeight: 1,
          textShadow: tier === 'legendary' ? '0 0 20px rgba(201,168,76,0.4)' : 'none',
        }}
      >
        ×{combo}
      </motion.p>
      <p style={{
        fontSize: '0.58rem',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        fontFamily: 'Georgia, serif',
        color: tier === 'legendary' ? 'rgba(201,168,76,0.65)'
          : tier === 'hot' ? 'rgba(201,168,76,0.50)'
          : 'rgba(26,25,22,0.30)',
        marginTop: 2,
      }}>
        {isRecord ? '✦ new record' : 'combo'}
      </p>
    </motion.div>
  )
}

// ─── ADHDEffects component ────────────────────────────────────────────────────

export function ADHDEffects() {
  const { adhdMode } = useADHD()
  const [combo, setCombo] = useState(0)
  const [comboVisible, setComboVisible] = useState(false)
  const maxCombo = useRef(0)
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastKeyTime = useRef(0)

  // ── Global keypress combo + floating key display ──────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!document.body.classList.contains('adhd-mode')) return
    if (e.key.length !== 1) return
    if (e.metaKey || e.ctrlKey || e.altKey) return

    const now = Date.now()
    const gap = now - lastKeyTime.current
    lastKeyTime.current = now

    playType()

    const active = document.activeElement as HTMLElement | null
    if (active) {
      const rect = active.getBoundingClientRect()
      typeSpark(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5)
    }

    setCombo(prev => {
      const next = gap > 1800 ? 1 : prev + 1
      showTypedKey(e.key, next)
      maxCombo.current = Math.max(maxCombo.current, next)

      if (COMBO_MILESTONES.includes(next)) {
        comboBurst(window.innerWidth * 0.5, window.innerHeight * 0.5, next)
        triggerShake(Math.min(next / 4, 10))
        triggerFlash(next)
        playComboMilestone(next)
      }

      return next
    })

    setComboVisible(true)
    if (comboTimer.current) clearTimeout(comboTimer.current)
    comboTimer.current = setTimeout(() => {
      setCombo(0)
      setComboVisible(false)
    }, 1800)
  }, [])

  // ── Click: burst + element jolt + screen shake on every click ────────────
  // ── Hover: in-your-face scale via Web Animations API ─────────────────────
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!document.body.classList.contains('adhd-mode')) return
      inkBurst(e.clientX, e.clientY, 12)
      playClick()
      triggerShake(3)  // shake on every click in ADHD mode

      const el = (e.target as HTMLElement).closest('button, a, [role="button"]') as HTMLElement | null
      if (el) elementShake(el)
    }

    const onMove = (e: MouseEvent) => {
      if (!document.body.classList.contains('adhd-mode')) return
      inkTrail(e.clientX, e.clientY)
    }

    const onOver = (e: MouseEvent) => {
      if (!document.body.classList.contains('adhd-mode')) return
      const el = (e.target as HTMLElement).closest('button, a, [role="button"]') as HTMLElement | null
      if (el) hoverIn(el)
    }

    const onOut = (e: MouseEvent) => {
      if (!document.body.classList.contains('adhd-mode')) return
      const el = (e.target as HTMLElement).closest('button, a, [role="button"]') as HTMLElement | null
      if (el) hoverOut(el)
    }

    document.addEventListener('click', onClick, { capture: true })
    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseout', onOut, { passive: true })
    return () => {
      document.removeEventListener('click', onClick, { capture: true })
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [])

  // ── Keypress combo listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!adhdMode) {
      setCombo(0)
      setComboVisible(false)
      return
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [adhdMode, handleKey])

  // ── Ambient marks ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (adhdMode) startAmbient()
    else stopAmbient()
    return stopAmbient
  }, [adhdMode])

  if (!adhdMode) return null

  return (
    <>
      <div
        id="adhd-sparkle-layer"
        style={{
          position: 'fixed', inset: 0,
          pointerEvents: 'none',
          zIndex: 9997,
          overflow: 'hidden',
        }}
      />
      <AnimatePresence>
        {comboVisible && combo >= 5 && (
          <ComboDisplay combo={combo} maxCombo={maxCombo.current} />
        )}
      </AnimatePresence>
    </>
  )
}
