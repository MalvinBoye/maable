'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createBook, updateBook, deleteBook, type BookStatus } from './actions'
import { XpBar } from '@/components/app/xp-bar'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Book {
  id: string
  title: string
  author: string
  status: BookStatus
  progress: number // 0–100
  total_pages: number | null
  cover_color: string
  updated_at: string
}

type AmbienceId = 'rain' | 'fire' | 'forest' | 'cafe' | 'off'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COVER_COLORS = [
  '#1a1916', '#44403c', '#78716c',
  '#d4a843', '#ef4444', '#4ade80',
  '#60a5fa', '#c084fc', '#f97316',
]

const COLUMNS: Array<{ status: BookStatus; label: string; emoji: string }> = [
  { status: 'reading',  label: 'Reading',      emoji: '' },
  { status: 'want',     label: 'Want to Read',  emoji: '' },
  { status: 'finished', label: 'Finished',      emoji: '' },
]

const AMBIENCE: Array<{ id: AmbienceId; label: string }> = [
  { id: 'rain',   label: 'Rain' },
  { id: 'fire',   label: 'Fire' },
  { id: 'forest', label: 'Forest' },
  { id: 'cafe',   label: 'Café' },
  { id: 'off',    label: 'Off' },
]

// ─── Web Audio helpers ────────────────────────────────────────────────────────

function makeNoise(ctx: AudioContext, type: 'white' | 'brown' | 'pink'): AudioBufferSourceNode {
  const len = 3 * ctx.sampleRate
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  } else if (type === 'brown') {
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      const v = (last + 0.02 * w) / 1.02
      d[i] = v * 3.5
      last = v
    }
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969   * b2 + w * 0.153852
      b3 = 0.8665  * b3 + w * 0.3104856
      b4 = 0.55    * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + w * 0.5362) * 0.11
    }
  }

  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

function lpf(ctx: AudioContext, freq: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = freq
  return f
}

function bpf(ctx: AudioContext, freq: number, q = 0.5): BiquadFilterNode {
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  f.Q.value = q
  return f
}

function gain(ctx: AudioContext, v: number): GainNode {
  const g = ctx.createGain()
  g.gain.value = v
  return g
}

// ─── useAmbience ─────────────────────────────────────────────────────────────

function useAmbience() {
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const stoppedRef = useRef(false)
  const currentCtxRef = useRef<AudioContext | null>(null)

  const stop = useCallback(() => {
    stoppedRef.current = true
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    masterRef.current = null
    currentCtxRef.current = null
  }, [])

  const play = useCallback((type: AmbienceId, vol: number) => {
    stop()
    if (type === 'off') return
    stoppedRef.current = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)() as AudioContext
    ctxRef.current = ctx
    currentCtxRef.current = ctx
    const master = gain(ctx, vol)
    master.connect(ctx.destination)
    masterRef.current = master

    const connect = (src: AudioBufferSourceNode, chain: AudioNode[]) => {
      let cur: AudioNode = src
      for (const n of chain) { cur.connect(n); cur = n }
      cur.connect(master)
      src.start()
    }

    if (type === 'rain') {
      const brown = makeNoise(ctx, 'brown')
      connect(brown, [lpf(ctx, 700)])

      const drizzle = makeNoise(ctx, 'white')
      const dg = gain(ctx, 0.55)
      connect(drizzle, [bpf(ctx, 3200, 0.4), dg])
    }

    if (type === 'fire') {
      const base = makeNoise(ctx, 'brown')
      connect(base, [lpf(ctx, 900)])

      // Crackle loop
      const crackle = (capturedCtx: AudioContext) => {
        if (stoppedRef.current || currentCtxRef.current !== capturedCtx) return
        const g2 = gain(ctx, 0)
        g2.connect(master)
        const n = makeNoise(ctx, 'white')
        n.connect(bpf(ctx, 1400 + Math.random() * 1800, 6)).connect(g2)
        const now = ctx.currentTime
        g2.gain.setValueAtTime(0, now)
        g2.gain.linearRampToValueAtTime(0.4 + Math.random() * 0.5, now + 0.012)
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.06 + Math.random() * 0.18)
        n.start(now)
        n.stop(now + 0.3)
        setTimeout(() => crackle(capturedCtx), 250 + Math.random() * 2200)
      }
      crackle(ctx)
    }

    if (type === 'forest') {
      const leaves = makeNoise(ctx, 'pink')
      const lg = gain(ctx, 0.55)
      connect(leaves, [bpf(ctx, 420, 0.3), lg])

      const shimmer = makeNoise(ctx, 'white')
      const sg = gain(ctx, 0.1)
      const hpf = ctx.createBiquadFilter()
      hpf.type = 'highpass'
      hpf.frequency.value = 5000
      connect(shimmer, [hpf, sg])
    }

    if (type === 'cafe') {
      // ── Quiet room ambience ───────────────────────────────────────────────
      connect(makeNoise(ctx, 'pink'), [bpf(ctx, 550, 0.22), gain(ctx, 0.07)])

      // ── Jazz synthesis at 128 BPM swing ──────────────────────────────────
      const BPM  = 128
      const beat = 60 / BPM    // ~0.469 s per beat
      const sw   = beat * 0.62 // swing "and" offset

      // Walking bass: Dm7 | G7 | Cmaj7 | Am7 (2 beats each)
      const BASS: number[] = [
        73.4, 87.3,    // Dm7: D2, F2
        98.0, 123.5,   // G7:  G2, B2
        65.4, 82.4,    // Cmaj7: C2, E2
        110.0, 130.8,  // Am7: A2, C3
      ]
      const CHORDS: number[][] = [
        [293.7, 349.2, 440.0, 523.3],  // Dm7
        [196.0, 293.7, 349.2, 466.2],  // G7
        [261.6, 329.6, 392.0, 493.9],  // Cmaj7
        [220.0, 261.6, 329.6, 392.0],  // Am7
      ]

      const playBass = (freq: number, t: number) => {
        const osc = ctx.createOscillator()
        const env = ctx.createGain()
        osc.type = 'sine'; osc.frequency.value = freq
        osc.connect(env).connect(master)
        env.gain.setValueAtTime(0, t)
        env.gain.linearRampToValueAtTime(0.30, t + 0.018)
        env.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.80)
        osc.start(t); osc.stop(t + beat)
      }

      const playChord = (notes: number[], t: number) => {
        for (const freq of notes) {
          const osc = ctx.createOscillator()
          const env = ctx.createGain()
          osc.type = 'triangle'; osc.frequency.value = freq
          osc.detune.value = (Math.random() - 0.5) * 10
          osc.connect(env).connect(master)
          env.gain.setValueAtTime(0, t)
          env.gain.linearRampToValueAtTime(0.034, t + 0.012)
          env.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.52)
          osc.start(t); osc.stop(t + beat)
        }
      }

      const playHat = (t: number, vol: number) => {
        const n = makeNoise(ctx, 'white')
        const hf = ctx.createBiquadFilter()
        hf.type = 'highpass'; hf.frequency.value = 7000
        const env = ctx.createGain()
        n.connect(hf).connect(env).connect(master)
        env.gain.setValueAtTime(0, t)
        env.gain.linearRampToValueAtTime(vol, t + 0.004)
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
        n.start(t); n.stop(t + 0.09)
      }

      const playSnare = (t: number) => {
        const n  = makeNoise(ctx, 'pink')
        const env = ctx.createGain()
        n.connect(bpf(ctx, 240, 1.6)).connect(env).connect(master)
        env.gain.setValueAtTime(0, t)
        env.gain.linearRampToValueAtTime(0.05, t + 0.008)
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.19)
        n.start(t); n.stop(t + 0.25)
      }

      let bar = 0
      const scheduleBar = (capturedCtx: AudioContext, barStart: number) => {
        if (stoppedRef.current || currentCtxRef.current !== capturedCtx) return
        const section = bar % 4
        const bNotes  = [BASS[section * 2]!, BASS[section * 2 + 1]!]
        const chord   = CHORDS[section]!

        for (let b = 0; b < 4; b++) {
          const t = barStart + b * beat
          playBass(bNotes[b % 2]!, t)
          playHat(t, b === 0 ? 0.065 : 0.042)
          playHat(t + sw, 0.028)
          if (b === 1 || b === 3) { playSnare(t); playChord(chord, t + 0.018) }
        }

        bar++
        const next = barStart + 4 * beat
        setTimeout(() => scheduleBar(capturedCtx, next),
          Math.max(0, (next - ctx.currentTime) * 1000 - 100))
      }
      scheduleBar(ctx, ctx.currentTime + 0.15)

      // ── Cutlery sounds ────────────────────────────────────────────────────

      // Fork tink – sharp high ping, very fast decay
      const forkTink = (capturedCtx: AudioContext) => {
        if (stoppedRef.current || currentCtxRef.current !== capturedCtx) return
        const env = gain(ctx, 0)
        env.connect(master)
        const n = makeNoise(ctx, 'white')
        n.connect(bpf(ctx, 2500 + Math.random() * 900, 20)).connect(env)
        const now = ctx.currentTime
        env.gain.setValueAtTime(0, now)
        env.gain.linearRampToValueAtTime(0.16 + Math.random() * 0.12, now + 0.003)
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.048 + Math.random() * 0.035)
        n.start(now); n.stop(now + 0.12)
        setTimeout(() => forkTink(capturedCtx), 2000 + Math.random() * 8000)
      }
      forkTink(ctx)

      // Knife scrape – mid-frequency texture sweep
      const knifeScrape = (capturedCtx: AudioContext) => {
        if (stoppedRef.current || currentCtxRef.current !== capturedCtx) return
        const env = gain(ctx, 0)
        env.connect(master)
        const n = makeNoise(ctx, 'white')
        const f = ctx.createBiquadFilter()
        f.type = 'bandpass'; f.frequency.value = 1500 + Math.random() * 700; f.Q.value = 3.5
        n.connect(f).connect(env)
        const dur = 0.07 + Math.random() * 0.11
        const now = ctx.currentTime
        env.gain.setValueAtTime(0, now)
        env.gain.linearRampToValueAtTime(0.09 + Math.random() * 0.07, now + 0.014)
        env.gain.setValueAtTime(0.09 + Math.random() * 0.07, now + dur - 0.02)
        env.gain.linearRampToValueAtTime(0, now + dur)
        n.start(now); n.stop(now + dur + 0.04)
        setTimeout(() => knifeScrape(capturedCtx), 4500 + Math.random() * 14000)
      }
      knifeScrape(ctx)

      // Plate put down – low thud + short ring
      const platePut = (capturedCtx: AudioContext) => {
        if (stoppedRef.current || currentCtxRef.current !== capturedCtx) return
        // thud
        const tenv = gain(ctx, 0); tenv.connect(master)
        const tn = makeNoise(ctx, 'brown')
        tn.connect(lpf(ctx, 480)).connect(tenv)
        // ring
        const osc = ctx.createOscillator()
        osc.type = 'sine'; osc.frequency.value = 600 + Math.random() * 200
        const renv = gain(ctx, 0); renv.connect(master)
        osc.connect(renv)
        const now = ctx.currentTime
        tenv.gain.setValueAtTime(0, now)
        tenv.gain.linearRampToValueAtTime(0.20, now + 0.007)
        tenv.gain.exponentialRampToValueAtTime(0.001, now + 0.11)
        tn.start(now); tn.stop(now + 0.18)
        renv.gain.setValueAtTime(0, now)
        renv.gain.linearRampToValueAtTime(0.07, now + 0.005)
        renv.gain.exponentialRampToValueAtTime(0.001, now + 0.32)
        osc.start(now); osc.stop(now + 0.4)
        setTimeout(() => platePut(capturedCtx), 7000 + Math.random() * 18000)
      }
      platePut(ctx)
    }
  }, [stop])

  const setVolume = useCallback((v: number) => {
    if (masterRef.current) masterRef.current.gain.value = v
  }, [])

  useEffect(() => () => stop(), [stop])

  return { play, setVolume }
}

// ─── useReadingTimer ──────────────────────────────────────────────────────────

function useReadingTimer() {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

// ─── SVG filter defs ─────────────────────────────────────────────────────────

function SketchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
      <defs>
        <filter id="rm-sketch" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.04" numOctaves="3" seed="9" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

// ─── Rough border ─────────────────────────────────────────────────────────────

function RoughFrame({ color = '#3d2b1a' }: { color?: string }) {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <rect
        x="3" y="3"
        width="calc(100% - 6px)"
        height="calc(100% - 6px)"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        filter="url(#rm-sketch)"
      />
    </svg>
  )
}

// ─── Reading Mode ─────────────────────────────────────────────────────────────

function ReadingMode({
  books,
  onProgressChange,
  onClose,
}: {
  books: Book[]
  onProgressChange: (id: string, progress: number) => void
  onClose: () => void
}) {
  const reading = books.filter((b) => b.status === 'reading')
  const [bookIdx, setBookIdx] = useState(0)
  const [ambience, setAmbienceState] = useState<AmbienceId>('off')
  const [vol, setVolState] = useState(0.45)
  const [progress, setProgress] = useState(reading[0]?.progress ?? 0)
  const [saved, setSaved] = useState(false)
  const timer = useReadingTimer()
  const { play, setVolume } = useAmbience()

  const book = reading[bookIdx] ?? null

  // Sync progress when book changes
  useEffect(() => { setProgress(book?.progress ?? 0) }, [bookIdx, book?.progress])

  const handleAmbience = (id: AmbienceId) => {
    setAmbienceState(id)
    play(id, vol)
  }

  const handleVol = (v: number) => {
    setVolState(v)
    setVolume(v)
  }

  const handleSaveProgress = () => {
    if (!book) return
    onProgressChange(book.id, progress)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const inkColor = '#2c1810'
  const mutedColor = '#8b6343'
  const paperCard = '#f8f0e0'
  const paperBg = '#ede0c4'

  return (
    <motion.div
      key="reading-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // Warm parchment background with paper texture simulation
        background: `
          radial-gradient(ellipse at 20% 10%, #f5e8cc 0%, ${paperBg} 60%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 28px,
            rgba(44,24,16,0.025) 28px,
            rgba(44,24,16,0.025) 29px
          )
        `,
        backgroundBlendMode: 'normal',
      }}
    >
      <SketchDefs />

      {/* Decorative rotated label left */}
      <span
        style={{
          position: 'absolute',
          left: 40,
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          fontSize: 10,
          letterSpacing: '0.22em',
          color: mutedColor,
          opacity: 0.5,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
        }}
      >
        reading corner
      </span>

      {/* Decorative rotated label right */}
      <span
        style={{
          position: 'absolute',
          right: 40,
          top: '50%',
          transform: 'translateY(-50%) rotate(90deg)',
          fontSize: 10,
          letterSpacing: '0.22em',
          color: mutedColor,
          opacity: 0.5,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
        }}
      >
        read · rest · repeat
      </span>

      {/* Exit */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 28,
          right: 36,
          fontSize: 12,
          color: mutedColor,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          letterSpacing: '0.05em',
          opacity: 0.7,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
        className="hover:opacity-100 transition-opacity"
      >
        esc · close
      </button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.08 }}
        style={{ width: '100%', maxWidth: 480, paddingBottom: 8 }}
      >

        {/* Book card */}
        {book ? (
          <div style={{ position: 'relative', marginBottom: 36 }}>
            <RoughFrame color={inkColor} />

            <div
              style={{
                backgroundColor: paperCard,
                padding: '32px 36px',
                position: 'relative',
              }}
            >
              {/* Book color spine */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 16,
                  bottom: 16,
                  width: 3,
                  backgroundColor: book.cover_color,
                  opacity: 0.85,
                  filter: 'url(#rm-sketch)',
                }}
              />

              {/* Book selector (if multiple reading) */}
              {reading.length > 1 && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  {reading.map((b, i) => (
                    <button
                      key={b.id}
                      onClick={() => setBookIdx(i)}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: i === bookIdx ? inkColor : 'transparent',
                        border: `1px solid ${inkColor}`,
                        opacity: i === bookIdx ? 1 : 0.3,
                        cursor: 'pointer',
                        padding: 0,
                        filter: 'url(#rm-sketch)',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Title */}
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 24,
                  lineHeight: 1.25,
                  color: inkColor,
                  marginBottom: 6,
                }}
              >
                {book.title}
              </p>

              {/* Author */}
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                  color: mutedColor,
                  marginBottom: 24,
                  letterSpacing: '0.04em',
                }}
              >
                {book.author}
              </p>

              {/* Rough divider */}
              <div
                style={{
                  height: 1,
                  backgroundColor: inkColor,
                  opacity: 0.12,
                  marginBottom: 24,
                  filter: 'url(#rm-sketch)',
                }}
              />

              {/* Progress */}
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    color: mutedColor,
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                  }}
                >
                  progress
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    style={{ flex: 1, accentColor: book.cover_color, cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      color: inkColor,
                      minWidth: 32,
                      textAlign: 'right',
                    }}
                  >
                    {progress}%
                  </span>
                  <button
                    onClick={handleSaveProgress}
                    style={{
                      fontSize: 11,
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      color: saved ? mutedColor : inkColor,
                      opacity: saved ? 0.6 : 1,
                      background: 'none',
                      border: 'none',
                      borderBottom: saved ? 'none' : `1px solid ${inkColor}`,
                      cursor: 'pointer',
                      padding: '0 0 1px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {saved ? 'saved ✓' : 'save'}
                  </button>
                </div>
              </div>

              {/* Timer */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    color: mutedColor,
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    textTransform: 'uppercase',
                  }}
                >
                  reading for
                </p>
                <p
                  style={{
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: 20,
                    color: inkColor,
                    letterSpacing: '0.04em',
                  }}
                >
                  {timer}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* No book being read */
          <div
            style={{
              position: 'relative',
              marginBottom: 36,
              backgroundColor: paperCard,
              padding: '40px 36px',
              textAlign: 'center',
            }}
          >
            <RoughFrame color={inkColor} />
            <p
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 16,
                color: mutedColor,
                lineHeight: 1.7,
              }}
            >
              No books in progress.<br />
              <span style={{ fontSize: 13 }}>Move a book to "Reading" to track it here.</span>
            </p>
          </div>
        )}

        {/* Ambience section */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: mutedColor,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            ~ ambience ~
          </p>

          {/* Ambience buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            {AMBIENCE.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleAmbience(id)}
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: ambience === id ? inkColor : mutedColor,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 12px',
                  position: 'relative',
                  opacity: ambience === id ? 1 : 0.55,
                  transition: 'opacity 0.15s',
                }}
                className="hover:opacity-100"
              >
                {label}
                {ambience === id && (
                  <motion.div
                    layoutId="ambience-under"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 8,
                      right: 8,
                      height: 1,
                      backgroundColor: inkColor,
                      filter: 'url(#rm-sketch)',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Volume slider */}
          <AnimatePresence>
            {ambience !== 'off' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'center',
                    paddingTop: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      color: mutedColor,
                      letterSpacing: '0.1em',
                    }}
                  >
                    vol
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={vol}
                    onChange={(e) => handleVol(Number(e.target.value))}
                    style={{ width: 140, accentColor: inkColor, cursor: 'pointer' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Corner marks */}
      {[
        { top: 24, left: 24 }, { top: 24, right: 24 },
        { bottom: 24, left: 24 }, { bottom: 24, right: 24 },
      ].map((pos, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            fontSize: 14,
            color: mutedColor,
            opacity: 0.3,
            fontFamily: 'Georgia, serif',
            filter: 'url(#rm-sketch)',
          }}
        >
          ✦
        </span>
      ))}
    </motion.div>
  )
}

// ─── Book spine card ──────────────────────────────────────────────────────────

function BookCard({
  book,
  onProgressChange,
  onStatusChange,
  onDelete,
}: {
  book: Book
  onProgressChange: (progress: number) => void
  onStatusChange: (status: BookStatus) => void
  onDelete: () => void
}) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="group relative cursor-pointer"
      onClick={() => setShowDetail(!showDetail)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute top-2 right-2 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-stone-600 text-base leading-none z-10"
      >
        ×
      </button>

      <div
        className="relative overflow-hidden px-4 py-4"
        style={{
          boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.07))',
          backgroundColor: 'var(--paper, #fff)',
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: book.cover_color }} />

        <div className="pl-2">
          <p
            className="text-sm text-stone-800 leading-snug mb-0.5 pr-6"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {book.title}
          </p>
          <p className="text-xs text-stone-400">{book.author}</p>

          {book.status === 'reading' && (
            <div className="mt-3">
              <div className="h-1 bg-stone-100 overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: book.cover_color }}
                  animate={{ width: `${book.progress}%` }}
                  transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                />
              </div>
              <p className="text-xs text-stone-400 mt-1">{book.progress}%</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-4 py-4 pl-6"
              style={{ borderTop: '1px solid rgba(26,25,22,0.05)', backgroundColor: 'rgba(26,25,22,0.02)' }}
            >
              {book.status === 'reading' && (
                <div className="mb-3">
                  <p className="text-xs text-stone-400 mb-1.5">Progress</p>
                  <input
                    type="range"
                    min={0} max={100}
                    value={book.progress}
                    onChange={(e) => onProgressChange(Number(e.target.value))}
                    className="w-full accent-stone-800"
                  />
                </div>
              )}

              <p className="text-xs text-stone-400 mb-1.5">Move to</p>
              <div className="flex gap-1.5 flex-wrap">
                {COLUMNS.filter((c) => c.status !== book.status).map((c) => (
                  <button
                    key={c.status}
                    onClick={() => onStatusChange(c.status)}
                    className="text-xs px-2 py-1 transition-colors"
                    style={{
                      border: '1px solid rgba(26,25,22,0.12)',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      color: '#78716c',
                    }}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Add book form ────────────────────────────────────────────────────────────

function AddBookForm({
  defaultStatus,
  onAdd,
  onCancel,
}: {
  defaultStatus: BookStatus
  onAdd: (data: { title: string; author: string; status: BookStatus; cover_color: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [color, setColor] = useState('#1a1916')

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className="px-4 py-4"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1.5px #1a1916',
        backgroundColor: 'var(--paper, #fff)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
        placeholder="Book title..."
        className="w-full text-sm text-stone-800 outline-none placeholder:text-stone-300 bg-transparent mb-2"
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
      />
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Author..."
        className="w-full text-xs text-stone-500 outline-none placeholder:text-stone-200 bg-transparent mb-3"
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
      />

      <div className="flex items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {COVER_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-3.5 h-3.5 rounded-full transition-transform"
              style={{
                backgroundColor: c,
                transform: color === c ? 'scale(1.4)' : 'scale(1)',
                outline: color === c ? `1.5px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { if (title.trim()) onAdd({ title, author, status: defaultStatus, cover_color: color }) }}
            className="text-xs text-white px-3 py-1"
            style={{ backgroundColor: '#1a1916', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Add
          </button>
          <button
            onClick={onCancel}
            className="text-xs text-stone-400 hover:text-stone-700"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReadingClient({ books: initialBooks, xpData }: { books: Book[]; xpData?: { level: number; xp: number } | null }) {
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [addingTo, setAddingTo] = useState<BookStatus | null>(null)
  const [readingMode, setReadingMode] = useState(false)

  const reading = books.filter((b) => b.status === 'reading')
  const want = books.filter((b) => b.status === 'want')
  const finished = books.filter((b) => b.status === 'finished')

  const handleAdd = useCallback(async (data: {
    title: string; author: string; status: BookStatus; cover_color: string
  }) => {
    setAddingTo(null)
    const temp: Book = {
      id: `temp-${Date.now()}`,
      title: data.title,
      author: data.author,
      status: data.status,
      progress: 0,
      total_pages: null,
      cover_color: data.cover_color,
      updated_at: new Date().toISOString(),
    }
    setBooks((prev) => [temp, ...prev])
    const { id } = await createBook({ title: data.title, author: data.author, status: data.status, progress: 0, total_pages: null, cover_color: data.cover_color })
    if (id) setBooks((prev) => prev.map((b) => b.id === temp.id ? { ...b, id } : b))
  }, [])

  const handleProgressChange = useCallback((id: string, progress: number) => {
    setBooks((prev) => prev.map((b) => b.id === id ? { ...b, progress } : b))
    updateBook(id, { progress })
  }, [])

  const handleStatusChange = useCallback((id: string, status: BookStatus) => {
    setBooks((prev) => prev.map((b) => b.id === id ? { ...b, status, progress: status === 'finished' ? 100 : b.progress } : b))
    updateBook(id, { status, ...(status === 'finished' ? { progress: 100 } : {}) })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id))
    deleteBook(id)
  }, [])

  const columnData: Array<{ status: BookStatus; label: string; emoji: string; items: Book[] }> = [
    { status: 'reading',  label: 'Reading',     emoji: '', items: reading  },
    { status: 'want',     label: 'Want to Read', emoji: '', items: want     },
    { status: 'finished', label: 'Finished',     emoji: '', items: finished },
  ]

  return (
    <>
      <div
        className="flex h-[calc(100dvh-4.5rem)] overflow-hidden"
        style={{ backgroundColor: 'var(--paper, #fff)' }}
      >
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          className="flex flex-col shrink-0 py-8 pl-10 pr-6"
          style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)' }}
        >
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/category-reading.png"
              alt="Reading Corner"
              className="w-full max-h-56 object-contain"
              draggable={false}
            />
          </div>

          <h1
            className="text-4xl text-stone-900 mt-4 leading-none"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Reading Corner
          </h1>
          <p className="text-sm text-stone-400 mt-1 mb-6">Every book is a new world.</p>

          <div className="flex gap-4 mb-6 flex-wrap">
            {columnData.map((col) => (
              <div key={col.status}>
                <p
                  className="text-2xl text-stone-800 leading-none"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  {col.items.length}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">{col.label.toLowerCase()}</p>
              </div>
            ))}
          </div>

          {xpData && (
            <div className="mb-5">
              <XpBar level={xpData.level} xp={xpData.xp} compact />
            </div>
          )}

          <button
            onClick={() => setAddingTo('want')}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors group self-start mb-3"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            <span className="w-6 h-6 rounded-full border border-stone-300 group-hover:border-stone-700 flex items-center justify-center text-base leading-none transition-colors">
              +
            </span>
            Add book
          </button>

          {/* Reading mode trigger */}
          <motion.button
            onClick={() => setReadingMode(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 text-sm self-start mt-1"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: '#3d2b1a',
              padding: '6px 12px 6px 0',
              borderBottom: '1px solid rgba(61,43,26,0.2)',
            }}
          >
            <span style={{ fontSize: 10, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#8a6d50' }}>◈</span>
            Focus mode
          </motion.button>
        </aside>

        {/* ── Kanban ───────────────────────────────────────────────────────── */}
        <main className="flex-1 flex overflow-hidden">
          {columnData.map((col) => (
            <div
              key={col.status}
              className="flex-1 flex flex-col overflow-hidden"
              style={{ borderRight: col.status !== 'finished' ? '1px solid rgba(26,25,22,0.05)' : 'none' }}
            >
              <div className="flex items-center justify-between px-6 pt-7 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{col.emoji}</span>
                  <p
                    className="text-sm text-stone-600"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    {col.label}
                  </p>
                  <span className="text-xs text-stone-300 ml-1">{col.items.length}</span>
                </div>
                <button
                  onClick={() => setAddingTo(col.status)}
                  className="text-stone-300 hover:text-stone-700 transition-colors text-lg leading-none"
                >
                  +
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-3" style={{ scrollbarWidth: 'none' }}>
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                <AnimatePresence>
                  {addingTo === col.status && (
                    <AddBookForm
                      key="add-form"
                      defaultStatus={col.status}
                      onAdd={handleAdd}
                      onCancel={() => setAddingTo(null)}
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                  {col.items.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onProgressChange={(p) => handleProgressChange(book.id, p)}
                      onStatusChange={(s) => handleStatusChange(book.id, s)}
                      onDelete={() => handleDelete(book.id)}
                    />
                  ))}
                </AnimatePresence>

                {col.items.length === 0 && addingTo !== col.status && (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <p
                      className="text-stone-300 text-sm"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      {col.status === 'reading' ? 'Start a book' :
                       col.status === 'want' ? 'Add to your list' : 'Nothing finished yet'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* Reading mode overlay */}
      <AnimatePresence>
        {readingMode && (
          <ReadingMode
            books={books}
            onProgressChange={handleProgressChange}
            onClose={() => setReadingMode(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
