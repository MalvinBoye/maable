'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'maable-last-level'

function playLevelUpSound() {
  if (typeof window === 'undefined') return
  let ctx: AudioContext | null = null
  try { ctx = new AudioContext() } catch { return }

  const seq = [
    [330, 0.00, 0.10],
    [392, 0.10, 0.10],
    [494, 0.20, 0.10],
    [523, 0.30, 0.18],
    [659, 0.48, 0.28],
    [880, 0.76, 0.45],
  ] as [number, number, number][]

  for (const [freq, delay, dur] of seq) {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = freq
    gain.gain.setValueAtTime(0, ctx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + delay + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + dur + 0.01)
  }
}

function burst(count = 40) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    const gold = Math.random() > 0.4
    const size = 4 + Math.random() * 10
    const angle = Math.PI * 2 * (i / count) + (Math.random() - 0.5) * 1.5
    const speed = 80 + Math.random() * 160
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed
    el.style.cssText = `
      position:fixed;
      left:50%;top:50%;
      width:${size}px;height:${size}px;
      background:${gold ? '#c9a84c' : 'rgba(255,255,255,0.7)'};
      border-radius:${Math.random() > 0.4 ? '50%' : '2px'};
      pointer-events:none;z-index:10002;
    `
    document.body.appendChild(el)
    el.animate([
      { transform: `translate(-50%,-50%)`, opacity: 1 },
      { transform: `translate(calc(-50% + ${vx}px),calc(-50% + ${vy}px)) scale(0)`, opacity: 0 },
    ], {
      duration: 600 + Math.random() * 500,
      easing: 'cubic-bezier(.1,.9,.2,1)',
      fill: 'forwards',
    }).onfinish = () => el.remove()
  }
}

function getPlayerClass(level: number) {
  if (level < 5)  return 'Novice'
  if (level < 10) return 'Apprentice'
  if (level < 15) return 'Scholar'
  if (level < 25) return 'Sage'
  if (level < 40) return 'Expert'
  if (level < 50) return 'Master'
  return 'Legend'
}

export function LevelUpEffect({ level }: { level: number }) {
  const [show, setShow] = useState(false)
  const [prevLevel, setPrevLevel] = useState<number | null>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
    if (level > stored && stored > 0 && !firedRef.current) {
      firedRef.current = true
      setPrevLevel(stored)
      setShow(true)
      playLevelUpSound()
      setTimeout(burst, 300)
      setTimeout(() => {
        setShow(false)
        localStorage.setItem(STORAGE_KEY, String(level))
        firedRef.current = false
      }, 3200)
    } else {
      localStorage.setItem(STORAGE_KEY, String(level))
    }
  }, [level])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Gold flash bg */}
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.35) 0%, rgba(201,168,76,0.08) 55%, transparent 75%)',
            }}
          />

          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          }} />

          {/* "LEVEL UP" banner */}
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.05 }}
            style={{ textAlign: 'center', position: 'relative' }}
          >
            {/* Glow */}
            <div style={{
              position: 'absolute', inset: '-30px -60px',
              background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.30) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <p style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 'clamp(12px, 1.2vw, 18px)',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.70)',
              marginBottom: 8,
            }}>
              ─── level up ───
            </p>

            <motion.p
              initial={{ letterSpacing: '0.05em' }}
              animate={{ letterSpacing: '0.22em' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(56px, 8vw, 120px)',
                color: '#c9a84c',
                lineHeight: 1,
                textShadow: '0 0 40px rgba(201,168,76,0.50), 0 0 80px rgba(201,168,76,0.20)',
              }}
            >
              {level}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ marginTop: 12 }}
            >
              <p style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(16px, 2vw, 26px)',
                color: 'rgba(255,255,255,0.75)',
              }}>
                {getPlayerClass(level)}
              </p>
              {prevLevel && (
                <p style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.30)',
                  marginTop: 6,
                  letterSpacing: '0.08em',
                }}>
                  {prevLevel} → {level}
                </p>
              )}
            </motion.div>

            {/* Gold corner brackets */}
            {([['top',-24,'left',-40],['top',-24,'right',-40],['bottom',-24,'left',-40],['bottom',-24,'right',-40]] as const).map(([v, vo, h, ho]) => (
              <div key={`${v}-${h}`} style={{
                position: 'absolute',
                top: v === 'top' ? vo : undefined, bottom: v === 'bottom' ? vo : undefined,
                left: h === 'left' ? ho : undefined, right: h === 'right' ? ho : undefined,
                width: 20, height: 20,
                borderTop: v === 'top' ? '2px solid rgba(201,168,76,0.55)' : 'none',
                borderBottom: v === 'bottom' ? '2px solid rgba(201,168,76,0.55)' : 'none',
                borderLeft: h === 'left' ? '2px solid rgba(201,168,76,0.55)' : 'none',
                borderRight: h === 'right' ? '2px solid rgba(201,168,76,0.55)' : 'none',
              }} />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
