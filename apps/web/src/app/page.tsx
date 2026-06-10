'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'

// ─── Shared styles ────────────────────────────────────────────────────────────

const G  = { fontFamily: 'Georgia, serif', fontStyle: 'italic' } as const

// ─── Animation presets ────────────────────────────────────────────────────────

// Camera-focus reveal: blur → sharp
const focus = (delay = 0) => ({
  initial:     { opacity: 0, scale: 0.88, filter: 'blur(12px)', y: 18 },
  whileInView: { opacity: 1, scale: 1,    filter: 'blur(0px)',  y: 0  },
  viewport:    { once: true, margin: '-50px' },
  transition:  { duration: 0.75, ease: [0.16, 1, 0.3, 1] as [number,number,number,number], delay },
})

// Rise from below
const rise = (delay = 0) => ({
  initial:     { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0  },
  viewport:    { once: true, margin: '-50px' },
  transition:  { type: 'spring' as const, stiffness: 210, damping: 24, delay },
})

// Slide from side
const slide = (from: 'left' | 'right', delay = 0) => ({
  initial:     { opacity: 0, x: from === 'left' ? -50 : 50 },
  whileInView: { opacity: 1, x: 0 },
  viewport:    { once: true, margin: '-60px' },
  transition:  { type: 'spring' as const, stiffness: 180, damping: 22, delay },
})

// ─── SplitText ────────────────────────────────────────────────────────────────

function SplitText({
  text, className, style, base = 0, step = 0.06,
}: {
  text: string; className?: string; style?: React.CSSProperties; base?: number; step?: number
}) {
  return (
    <span className={className} style={{ display: 'block', ...style }}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 28, rotateX: 12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: base + i * step }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 h-[4.5rem]"
      style={{ backgroundColor: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(26,25,22,0.07)' }}
    >
      <span className="text-xl text-stone-900 select-none" style={G}>Maable</span>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-4 py-2" style={G}>Sign in</Link>
        <Link href="/signup" className="text-sm text-white px-5 py-2.5 transition-colors" style={{ backgroundColor: '#1a1916', ...G }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1916')}>
          Get started
        </Link>
      </div>
    </nav>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ title, sub, preview, gold, delay = 0 }: {
  title: string; sub: string; preview: React.ReactNode; gold?: boolean; delay?: number
}) {
  return (
    <motion.div
      {...focus(delay)}
      className="flex flex-col p-6 relative overflow-hidden"
      style={{ backgroundColor: gold ? '#0e0d0b' : '#fff', border: `1px solid ${gold ? 'rgba(201,168,76,0.30)' : 'rgba(26,25,22,0.08)'}`, borderRadius: 6, height: 200 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {gold && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(26,25,22,0.025) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
      <div className="flex-1 flex items-center justify-center relative">{preview}</div>
      <div className="relative mt-3">
        <p className="text-sm font-medium" style={{ ...G, color: gold ? 'rgba(255,255,255,0.85)' : '#1a1916' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ ...G, color: gold ? 'rgba(255,255,255,0.38)' : 'rgba(26,25,22,0.42)' }}>{sub}</p>
      </div>
    </motion.div>
  )
}

// ─── Spotlight dark card ──────────────────────────────────────────────────────

function SpotlightCard({ title, sub, gold, delay = 0 }: { title: string; sub: string; gold?: boolean; delay?: number }) {
  const [pos, setPos] = useState({ x: 50, y: 50 })
  return (
    <motion.div
      {...focus(delay)}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
      }}
      className="relative overflow-hidden p-6"
      style={{ backgroundColor: '#0e0d0b', border: `1px solid ${gold ? 'rgba(201,168,76,0.30)' : 'rgba(201,168,76,0.12)'}`, borderRadius: 4 }}
    >
      {gold && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.70), transparent)' }} />}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.011) 3px,rgba(255,255,255,0.011) 4px)' }} />
      <motion.div
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(201,168,76,0.14) 0%, transparent 58%)`, transition: 'background 0.1s' }}
      />
      <p className="text-xs tracking-widest uppercase mb-2 relative" style={{ color: `rgba(201,168,76,${gold ? 0.9 : 0.55})`, ...G }}>{title}</p>
      <p className="text-sm leading-relaxed relative" style={{ color: 'rgba(255,255,255,0.52)', ...G }}>{sub}</p>
    </motion.div>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, gold }: { label: string; gold?: boolean }) {
  return (
    <span className="text-[11px] px-3 py-1" style={gold
      ? { backgroundColor: 'rgba(201,168,76,0.10)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)', ...G }
      : { backgroundColor: 'rgba(26,25,22,0.05)', color: '#78716c', ...G }
    }>{label}</span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {

  // Hero parallax refs
  const heroRef  = useRef<HTMLElement>(null)
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const mascotY  = useTransform(heroP, [0, 1], [0,  -90])
  const heroTextY = useTransform(heroP, [0, 1], [0,  50])

  // Statement section parallax
  const stmtRef = useRef<HTMLElement>(null)
  const { scrollYProgress: stmtP } = useScroll({ target: stmtRef, offset: ['start end', 'end start'] })
  const stmtScale = useTransform(stmtP, [0, 0.4, 0.7, 1], [0.92, 1, 1, 0.94])
  const stmtOpacity = useTransform(stmtP, [0, 0.25, 0.75, 1], [0, 1, 1, 0])

  const CATEGORIES = [
    { id: 'career',  label: 'Career',        desc: 'Goals that compound'        },
    { id: 'student', label: 'Student',        desc: 'Deadlines, tamed'           },
    { id: 'hobbies', label: 'Hobbies',        desc: 'Make time for joy'          },
    { id: 'reading', label: 'Reading Corner', desc: 'Books & study in one place' },
    { id: 'lazy',    label: 'Feeling Lazy',   desc: 'Rest days count too'        },
  ]

  return (
    <>
      <Nav />
      <div style={{ overflowX: 'hidden', backgroundColor: '#ffffff' }}>
        <style>{`
          @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
          @keyframes pulse-dot { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.25); } }
        `}</style>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 1 — HERO                        ║
            ╚═══════════════════════════════════════════╝ */}
        <section ref={heroRef} className="flex overflow-hidden" style={{ height: '100dvh', position: 'relative' }}>

          {/* Warm radial glow */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 70% 80% at 64% 60%, rgba(201,168,76,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />

          {/* LEFT ── text */}
          <motion.div
            style={{ y: heroTextY, width: '52%', paddingLeft: '3.5rem', paddingRight: '3rem', paddingTop: '7rem', paddingBottom: '3.5rem' }}
            className="flex flex-col justify-between relative z-10"
          >
            <div>
              {/* Live badge */}
              <motion.div {...rise(0)} className="mb-6">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.28)', padding: '4px 12px', ...G }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#c9a84c', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.65rem', color: '#c9a84c', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Focus Mode · Companion · now live</span>
                </span>
              </motion.div>

              <div style={{ perspective: '800px' }}>
                <SplitText text="Make life" base={0.05} step={0.08}
                  style={{ ...G, fontSize: 'clamp(48px,5.4vw,80px)', color: '#1a1916', lineHeight: 1 }} />
                <SplitText text="manageable." base={0.18} step={0.08}
                  style={{ ...G, fontSize: 'clamp(48px,5.4vw,80px)', color: '#1a1916', lineHeight: 1.05 }} />
              </div>

              <motion.p {...rise(0.38)} className="text-stone-500 mt-6 leading-relaxed max-w-md" style={{ ...G, fontSize: '1.06rem' }}>
                Tasks. Habits. Notes. Moodboard. Focus Mode. XP.<br />
                The one app that actually feels like a reward.
              </motion.p>

              <motion.div {...rise(0.48)} className="flex items-center gap-4 mt-10">
                <Link href="/signup" className="text-sm text-white px-7 py-3.5 transition-colors" style={{ backgroundColor: '#1a1916', ...G }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1916')}>
                  Get started free
                </Link>
                <Link href="/login" className="text-sm text-stone-400 hover:text-stone-900 transition-colors px-2" style={G}>Sign in →</Link>
              </motion.div>

              <motion.div {...rise(0.56)} className="flex flex-wrap gap-2 mt-8">
                {['Focus Mode','Companion','Moodboard','Timer'].map(p => <Pill key={p} label={p} gold />)}
                {['Tasks','Habits','Notes & Flashcards','Journal','ADHD Mode','Breathing','Games','Spotify','XP + Levels'].map(p => <Pill key={p} label={p} />)}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="flex items-end justify-between">
              <div className="flex gap-10">
                {[{ v: 'Free', l: 'to start' }, { v: '10+', l: 'built-in tools' }, { v: '5', l: 'life areas' }].map(s => (
                  <div key={s.l}>
                    <p className="text-2xl text-stone-900 leading-none" style={G}>{s.v}</p>
                    <p className="text-xs text-stone-400 mt-1" style={G}>{s.l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-300 tracking-widest" style={G}>scroll ↓</p>
            </motion.div>
          </motion.div>

          {/* RIGHT ── mascot with parallax */}
          <div className="flex-1 relative overflow-hidden" style={{ paddingTop: '4.5rem' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(26,25,22,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse 90% 85% at 55% 55%, black 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 55% 55%, black 30%, transparent 75%)', pointerEvents: 'none' }} />
            <motion.div style={{ y: mascotY }} className="w-full h-full flex items-center justify-center">
              <motion.img
                src="/illustrations/mascot.png" alt="Maable"
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '58%', maxWidth: 360, objectFit: 'contain', animation: 'bob 7s ease-in-out infinite' }}
                draggable={false}
              />
            </motion.div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 2 — STATEMENT                   ║
            ╚═══════════════════════════════════════════╝ */}
        <section ref={stmtRef} className="flex flex-col items-center justify-center relative overflow-hidden"
          style={{ minHeight: '70vh', backgroundColor: '#faf9f7', padding: '100px 40px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(26,25,22,0.04) 1px, transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />

          <motion.div style={{ scale: stmtScale, opacity: stmtOpacity }} className="text-center relative z-10 max-w-4xl">
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-8" style={G}>Why Maable</p>
            <SplitText text="One app that rewards" base={0} step={0.055}
              style={{ ...G, fontSize: 'clamp(40px, 5.5vw, 80px)', color: '#1a1916', lineHeight: 1.1, display: 'block' }} />
            <SplitText text="the work you actually do." base={0.3} step={0.055}
              style={{ ...G, fontSize: 'clamp(40px, 5.5vw, 80px)', color: '#1a1916', lineHeight: 1.1, display: 'block' }} />
            <motion.p {...rise(0.7)} className="text-stone-400 mt-8 text-lg leading-relaxed max-w-xl mx-auto" style={G}>
              Stop using apps that make productivity feel like a chore.
              Every task, habit, note, and breath earns you something back.
            </motion.p>
          </motion.div>
        </section>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 3 — FEATURE BENTO               ║
            ╚═══════════════════════════════════════════╝ */}
        <section style={{ padding: '100px 80px', backgroundColor: '#fff' }}>
          <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-3" style={G}>Everything included</motion.p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
            <SplitText text="Built different." base={0.05} step={0.08}
              style={{ ...G, fontSize: 'clamp(30px, 3.5vw, 52px)', color: '#1a1916', lineHeight: 1 }} />
            <motion.p {...rise(0.2)} className="text-sm text-stone-400 max-w-xs text-right" style={G}>
              Not a to-do list. Not a planner. A full system for actually being productive.
            </motion.p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FeatureCard delay={0} title="Tasks & Habits" sub="Build routines that stick"
              preview={
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[{ w: '80%', done: true }, { w: '60%', done: true }, { w: '90%', done: false }, { w: '50%', done: false }].map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: r.done ? '#1a1916' : 'transparent', border: `1.5px solid ${r.done ? '#1a1916' : 'rgba(26,25,22,0.18)'}`, flexShrink: 0 }} />
                      <div style={{ height: 5, width: r.w, backgroundColor: r.done ? 'rgba(26,25,22,0.12)' : 'rgba(26,25,22,0.07)', borderRadius: 3 }} />
                    </div>
                  ))}
                </div>
              }
            />
            <FeatureCard delay={0.08} title="Notes & Flashcards" sub="Write once, study forever"
              preview={
                <div style={{ width: '100%' }}>
                  {[100,75,90,55,80].map((w, i) => (
                    <div key={i} style={{ height: 4, width: `${w}%`, backgroundColor: 'rgba(26,25,22,0.07)', borderRadius: 2, marginBottom: 6 }} />
                  ))}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {['flashcards','revise'].map(t => <span key={t} style={{ fontSize: '0.55rem', padding: '3px 8px', backgroundColor: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c', borderRadius: 20, ...G }}>{t}</span>)}
                  </div>
                </div>
              }
            />
            <FeatureCard delay={0.16} title="Focus / Simple Mode" sub="Strip to essentials instantly" gold
              preview={
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                  {['Tasks','Habits','Notes','Schedule'].map((l) => (
                    <div key={l} style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ width: 18, height: 3, backgroundColor: 'rgba(201,168,76,0.5)', borderRadius: 2 }} />
                      <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', ...G }}>{l}</p>
                    </div>
                  ))}
                </div>
              }
            />
            <FeatureCard delay={0.06} title="AI Companion" sub="Reacts to your actual progress"
              preview={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/illustrations/chibi-happy.png" alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} draggable={false} />
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['😤 mad','😢 sad','😊 happy','🤩 ecstatic'].map(m => (
                      <span key={m} style={{ fontSize: '0.42rem', padding: '2px 6px', backgroundColor: 'rgba(26,25,22,0.05)', borderRadius: 20, color: 'rgba(26,25,22,0.45)', ...G }}>{m}</span>
                    ))}
                  </div>
                </div>
              }
            />
            <FeatureCard delay={0.14} title="Focus Timer" sub="Runs across every page"
              preview={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={64} height={64} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                      <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(26,25,22,0.06)" strokeWidth={2.5} />
                      <circle cx={32} cy={32} r={26} fill="none" stroke="#c9a84c" strokeWidth={2.5} strokeLinecap="round" strokeDasharray={163.4} strokeDashoffset={36} />
                    </svg>
                    <p style={{ ...G, fontSize: '0.95rem', color: '#1a1916', lineHeight: 1 }}>24:58</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['5 min','25 min','45 min'].map(t => <span key={t} style={{ fontSize: '0.52rem', padding: '3px 8px', backgroundColor: 'rgba(26,25,22,0.05)', borderRadius: 20, color: 'rgba(26,25,22,0.45)', ...G }}>{t}</span>)}
                  </div>
                </div>
              }
            />
            <FeatureCard delay={0.22} title="XP & Levels" sub="Climb the leaderboard"
              preview={
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...G, fontSize: '0.6rem', color: 'rgba(26,25,22,0.4)' }}>Level 14</span>
                    <span style={{ ...G, fontSize: '0.6rem', color: '#c9a84c' }}>+120 XP</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'rgba(26,25,22,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '68%' }} viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} style={{ height: '100%', backgroundColor: '#c9a84c', borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#1 streak','Top 5%','7-day run'].map(b => (
                      <span key={b} style={{ fontSize: '0.48rem', padding: '2px 7px', backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: '#c9a84c', borderRadius: 20, ...G }}>{b}</span>
                    ))}
                  </div>
                </div>
              }
            />
          </div>
        </section>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 4 — CATEGORIES                  ║
            ╚═══════════════════════════════════════════╝ */}
        <section style={{ padding: '100px 80px', backgroundColor: '#faf9f7' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 56 }}>
            <div>
              <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-3" style={G}>Five spaces</motion.p>
              <SplitText text="Your whole life, organized." base={0.05} step={0.06}
                style={{ ...G, fontSize: 'clamp(28px, 3.2vw, 48px)', color: '#1a1916', lineHeight: 1.1 }} />
            </div>
            <motion.p {...rise(0.2)} className="text-sm text-stone-400 max-w-xs text-right" style={G}>Every corner of your day has a home. Nothing falls through the cracks.</motion.p>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                {...focus(i * 0.09)}
                className="flex flex-col items-center py-8 px-4 relative overflow-hidden"
                style={{ backgroundColor: '#fff', border: '1px solid rgba(26,25,22,0.07)', borderRadius: 6 }}
                whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.10)', transition: { duration: 0.22 } }}
              >
                <div style={{ width: 100, height: 100 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/illustrations/category-${cat.id}.png`} alt={cat.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
                </div>
                <p className="mt-4 text-sm text-stone-800 text-center" style={G}>{cat.label}</p>
                <p className="text-xs text-stone-400 mt-1 text-center" style={G}>{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 5 — COMPANION                   ║
            ╚═══════════════════════════════════════════╝ */}
        <section className="flex overflow-hidden" style={{ minHeight: '90vh', backgroundColor: '#fff' }}>
          {/* Chibi with parallax */}
          <div className="flex items-end justify-center shrink-0 overflow-hidden" style={{ width: '44%', paddingTop: '60px' }}>
            <motion.div
              {...slide('left', 0)}
              style={{ width: '100%', height: '100%' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/chibi-happy.png" alt="Chibi companion" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom' }} draggable={false} />
            </motion.div>
          </div>

          <div className="flex flex-col justify-center flex-1" style={{ padding: '80px 80px 80px 40px' }}>
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-5" style={G}>Companion + levelling up</motion.p>
            <SplitText text="Productivity that feels like a game." base={0.05} step={0.06}
              style={{ ...G, fontSize: 'clamp(28px, 3.2vw, 48px)', color: '#1a1916', lineHeight: 1.2, marginBottom: 16 }} />
            <motion.p {...rise(0.3)} className="text-stone-400 text-sm leading-relaxed max-w-sm" style={G}>
              Your Chibi companion is always watching. Fall behind and it goes sad.
              Let things pile up and it gets mad. Crush the day and it absolutely loses it.
            </motion.p>

            <ul className="mt-8 space-y-4">
              {[
                'Every task and habit earns XP toward your next level',
                'Climb the global leaderboard — compete with or root for friends',
                'Companion reacts in real time: euphoric when crushing it, blunt when slacking',
                'Gamified profile with classes, achievements, and a full battle log',
              ].map((f, i) => (
                <motion.li key={f} {...rise(0.35 + i * 0.07)} className="flex items-start gap-3">
                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-700 shrink-0" />
                  <p className="text-sm text-stone-600 leading-relaxed" style={G}>{f}</p>
                </motion.li>
              ))}
            </ul>

            <motion.div {...rise(0.65)} className="mt-10">
              <Link href="/signup" className="inline-block text-sm text-white px-7 py-3.5 transition-colors" style={{ backgroundColor: '#1a1916', ...G }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1916')}>
                Start earning XP
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 6 — FOCUS & WELLBEING (dark)    ║
            ╚═══════════════════════════════════════════╝ */}
        <section style={{ padding: '100px 80px', backgroundColor: '#0e0d0b', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.008) 3px,rgba(255,255,255,0.008) 4px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(201,168,76,0.6)', ...G }}>Focus & wellbeing</motion.p>
            <SplitText text="Built for the way your brain actually works." base={0.05} step={0.055}
              style={{ ...G, color: 'rgba(255,255,255,0.88)', fontSize: 'clamp(28px, 3.2vw, 50px)', lineHeight: 1.2, maxWidth: '60%', marginBottom: 16 }} />
            <motion.p {...rise(0.35)} className="text-sm leading-relaxed max-w-lg mb-14" style={{ color: 'rgba(255,255,255,0.38)', ...G }}>
              From cinematic Focus Mode to ADHD-friendly typing effects — tools that meet you where you are, not where productivity gurus think you should be.
            </motion.p>

            <div className="grid grid-cols-2 gap-4 max-w-3xl">
              <SpotlightCard delay={0}    gold title="Focus / Simple Mode"   sub="One click strips Maable to the essentials. Cinematic wipe animation pulls you into flow. Just tasks, habits, notes, schedule, and your timer." />
              <SpotlightCard delay={0.10}      title="ADHD Mode"             sub="Watch every keystroke float up from your cursor — ridiculous_coding style. Combo counter, screen shake, milestone bursts." />
              <SpotlightCard delay={0.20}      title="Daily Journal"         sub="Private date-based journal with mood tracker, writing prompts, streak counter, and a mini calendar view." />
              <SpotlightCard delay={0.30}      title="Breathwork"            sub="Box breathing, 4-7-8, Wim Hof. A minimal animated circle with no distractions — just rhythm and time." />
            </div>

            <motion.div {...rise(0.45)} className="mt-12">
              <Link href="/signup" className="inline-block text-sm px-7 py-3.5 transition-colors" style={{ backgroundColor: '#c9a84c', color: '#0e0d0b', ...G }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e2c068')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c9a84c')}>
                Try it free
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 7 — CREATE PLAY CONNECT         ║
            ╚═══════════════════════════════════════════╝ */}
        <section className="flex overflow-hidden" style={{ minHeight: '90vh', backgroundColor: '#faf9f7' }}>
          <div className="flex flex-col justify-center" style={{ width: '50%', padding: '80px 40px 80px 80px' }}>
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-5" style={G}>Create, play & connect</motion.p>
            <SplitText text="More than a task manager." base={0.05} step={0.07}
              style={{ ...G, fontSize: 'clamp(28px, 3.2vw, 48px)', color: '#1a1916', lineHeight: 1.2, marginBottom: 16 }} />
            <motion.p {...rise(0.28)} className="text-stone-400 text-sm leading-relaxed max-w-sm" style={G}>
              Maable has a moodboard for your aesthetic, games to pass the time,
              and Spotify so the music never has to stop.
            </motion.p>
            <ul className="mt-8 space-y-4">
              {[
                'Moodboard — pin photos and sticky notes anywhere on a free-form corkboard',
                'Tic-Tac-Toe with friends: pass-and-play or real-time online',
                'Spotify integration: now-playing card right on your dashboard',
                'Connect integrations: Canvas LMS, Spotify, and more',
              ].map((f, i) => (
                <motion.li key={f} {...rise(0.33 + i * 0.07)} className="flex items-start gap-3">
                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-700 shrink-0" />
                  <p className="text-sm text-stone-600 leading-relaxed" style={G}>{f}</p>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex-1 flex flex-col gap-4 justify-center" style={{ padding: '80px 80px 80px 20px' }}>
            {/* Moodboard */}
            <motion.div {...focus(0.08)} className="relative flex-1 overflow-hidden" style={{ backgroundColor: '#ede8e0', backgroundImage: 'radial-gradient(circle, rgba(26,25,22,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px', borderRadius: 6, border: '1px solid rgba(26,25,22,0.10)', minHeight: 200 }}>
              {[{ x:'12%', y:'18%', c:'#c9a84c', r:-6 }, { x:'48%', y:'12%', c:'#e07c5d', r:3 }, { x:'28%', y:'50%', c:'#6b8fa0', r:-3 }, { x:'66%', y:'42%', c:'#8a7a6a', r:5 }].map((p, i) => (
                <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 68, height: 78, backgroundColor: '#fff', borderRadius: 2, boxShadow: '2px 3px 10px rgba(0,0,0,0.13)', transform: `rotate(${p.r}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 11 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: p.c, marginBottom: 7 }} />
                  <div style={{ width: '70%', height: 3, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 2, marginBottom: 5 }} />
                  <div style={{ width: '50%', height: 3, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 2 }} />
                </div>
              ))}
              <p style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: '0.7rem', color: 'rgba(26,25,22,0.22)', pointerEvents: 'none', ...G }}>moodboard</p>
            </motion.div>
            {/* Games + Spotify */}
            <div className="flex gap-4 shrink-0" style={{ height: 88 }}>
              <motion.div {...focus(0.15)} className="flex-1 flex items-center justify-center gap-3" style={{ backgroundColor: '#1a1916', borderRadius: 6, border: '1px solid rgba(201,168,76,0.15)' }}>
                <div className="grid grid-cols-3 gap-1">
                  {['✕','○','✕','','○','','○','','✕'].map((c, i) => (
                    <div key={i} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.08)', color: c === '✕' ? '#c9a84c' : 'rgba(255,255,255,0.5)', borderRadius: 1, ...G }}>{c}</div>
                  ))}
                </div>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', ...G }}>games</p>
              </motion.div>
              <motion.div {...focus(0.22)} className="flex-1 flex items-center gap-3 px-4" style={{ backgroundColor: '#141210', borderRadius: 6, border: '1px solid rgba(29,185,84,0.2)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 3, backgroundColor: 'rgba(29,185,84,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M17.2 10.8c-3-1.8-8-1.9-10.8-1.1-.5.1-.9-.2-1-.6-.1-.5.2-.9.6-1C9 7.1 14.5 7.2 18 9.3c.4.2.5.7.3 1.1-.3.4-.7.6-1.1.4zm-.1 2.9c-.3.4-.8.5-1.2.3-2.5-1.5-6.3-2-9.2-1.1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.4-.9 7.5-.5 10.4 1.3.4.3.5.8.5 1zm-1.3 2.8c-.2.3-.6.5-1 .3-2.2-1.3-5-1.6-8.2-.9-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 3.6-.8 6.7-.5 9.2 1 .3.3.4.6.3.9z" fill="#1db954"/></svg>
                </div>
                <div className="min-w-0">
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', ...G }}>now playing</p>
                  <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', ...G }}>on your dashboard</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 8 — SKINS (horizontal drag)     ║
            ╚═══════════════════════════════════════════╝ */}
        <section style={{ padding: '100px 0', backgroundColor: '#0a0908', overflow: 'hidden' }}>
          <div style={{ padding: '0 80px', marginBottom: 48 }}>
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(201,168,76,0.55)', ...G }}>coming soon</motion.p>
            <SplitText text="Skins. Your vibe, your Maable." base={0.05} step={0.06}
              style={{ ...G, color: 'rgba(255,255,255,0.88)', fontSize: 'clamp(28px, 3.2vw, 48px)', lineHeight: 1.2, marginBottom: 12 }} />
            <motion.p {...rise(0.3)} className="text-sm max-w-md" style={{ ...G, color: 'rgba(255,255,255,0.35)', lineHeight: '1.7' }}>
              Earn them with XP or unlock with achievements — no purchases required.
            </motion.p>
          </div>

          {/* Draggable horizontal row */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -680, right: 0 }}
            dragTransition={{ power: 0.2, timeConstant: 200 }}
            className="flex gap-5 cursor-grab active:cursor-grabbing select-none"
            style={{ paddingLeft: 80, paddingRight: 80, width: 'max-content' }}
          >
            {[
              { name: 'Cybercore',    desc: 'Neon grid, terminal glow',  bg: '#05050f', accent: '#00ffff',  border: 'rgba(0,255,255,0.25)',    preview: (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
                  <div style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
                    <div style={{ height: 6, backgroundColor: 'rgba(0,255,255,0.18)', borderRadius: 1, marginBottom: 6 }} />
                    <div style={{ height: 4, width: '60%', backgroundColor: 'rgba(0,255,255,0.10)', borderRadius: 1, marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 36, backgroundColor: 'rgba(0,255,255,0.06)', border: '1px solid rgba(0,255,255,0.18)', borderRadius: 2 }} />)}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, height: 2, background: 'linear-gradient(90deg, #00ffff, transparent)' }} />
                  <div style={{ position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00ffff', boxShadow: '0 0 8px #00ffff' }} />
                </div>
              )},
              { name: 'Acid Design',  desc: 'Psychedelic, wobbly, loud',  bg: '#c8ff00', accent: '#ff00c8', border: 'rgba(0,0,0,0.15)',         preview: (
                <div style={{ position: 'absolute', top: 14, left: 14, right: 14 }}>
                  <div style={{ height: 9, backgroundColor: '#ff00c8', borderRadius: 40, marginBottom: 8 }} />
                  <div style={{ height: 5, width: '70%', backgroundColor: '#7b00ff', borderRadius: 40, marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 2, height: 42, backgroundColor: '#ff00c8', borderRadius: 40 }} />
                    <div style={{ flex: 1, height: 42, backgroundColor: '#00c8ff', borderRadius: 40 }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: -28, right: 0, fontSize: '1.6rem' }}>✦</div>
                </div>
              )},
              { name: 'Shibuya Punk', desc: 'Tokyo street, hot pink',     bg: '#0d0006', accent: '#ff1493', border: 'rgba(255,20,147,0.30)',    preview: (
                <div style={{ position: 'absolute', top: 10, left: 10, right: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.55rem', color: '#ff1493', letterSpacing: '0.2em', fontFamily: 'monospace' }}>渋谷</span>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #ff1493' }} />
                  </div>
                  <div style={{ height: 5, backgroundColor: 'rgba(255,20,147,0.25)', borderRadius: 1, marginBottom: 5 }} />
                  <div style={{ height: 3, width: '45%', backgroundColor: 'rgba(255,20,147,0.15)', borderRadius: 1, marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 32, backgroundColor: 'rgba(255,20,147,0.08)', border: '1px solid rgba(255,20,147,0.22)', borderRadius: 2 }} />)}
                  </div>
                </div>
              )},
              { name: 'ASCII Art',    desc: 'Terminal, retro, monospace',  bg: '#080800', accent: '#00ff41', border: 'rgba(0,255,65,0.20)',     preview: (
                <div style={{ position: 'absolute', inset: 0, padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.45rem', color: 'rgba(0,255,65,0.55)', lineHeight: 1.5, overflow: 'hidden' }}>
                  <div>{'╔══════════════╗'}</div><div>{'║ MAABLE v1.0  ║'}</div><div>{'╠══════════════╣'}</div>
                  <div style={{ color: 'rgba(0,255,65,0.9)' }}>{'> TASK done  ✓'}</div><div>{'> HABIT run  ✓'}</div>
                  <div>{'> XP: +150 ████░'}</div><div style={{ color: 'rgba(0,255,65,0.35)' }}>{'╚══════════════╝'}</div>
                </div>
              )},
              { name: 'Kawaii',       desc: 'Pastel, soft, cute',          bg: '#fff0f8', accent: '#ff85c2', border: 'rgba(255,133,194,0.30)',  preview: (
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
                  <div style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: 8 }}>✦</div>
                  <div style={{ height: 6, backgroundColor: 'rgba(255,133,194,0.30)', borderRadius: 40, marginBottom: 6 }} />
                  <div style={{ height: 4, width: '55%', margin: '0 auto', backgroundColor: 'rgba(255,133,194,0.20)', borderRadius: 40, marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 32, backgroundColor: 'rgba(255,133,194,0.12)', border: '1px solid rgba(255,133,194,0.28)', borderRadius: 20 }} />)}
                  </div>
                </div>
              )},
            ].map((skin, i) => (
              <motion.div key={skin.name} {...focus(i * 0.07)} className="flex flex-col shrink-0" style={{ gap: 10, width: 200 }}>
                <div style={{ height: 170, borderRadius: 6, overflow: 'hidden', position: 'relative', backgroundColor: skin.bg, border: `1px solid ${skin.border}`, boxShadow: `0 0 24px ${skin.accent}18` }}>
                  {skin.preview}
                </div>
                <p style={{ ...G, fontSize: '0.76rem', color: 'rgba(255,255,255,0.62)' }}>{skin.name}</p>
                <p style={{ ...G, fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)', marginTop: -6 }}>{skin.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p {...rise(0.3)} className="text-xs mt-10" style={{ ...G, color: 'rgba(201,168,76,0.38)', paddingLeft: 80 }}>
            ← drag to explore
          </motion.p>
        </section>

        {/* ╔═══════════════════════════════════════════╗
            ║  SECTION 9 — FINAL CTA                   ║
            ╚═══════════════════════════════════════════╝ */}
        <section className="flex flex-col items-center justify-center relative overflow-hidden" style={{ minHeight: '100dvh' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(26,25,22,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/mascot.png" alt="" aria-hidden draggable={false}
            style={{ position: 'absolute', bottom: 0, right: 0, height: '72%', objectFit: 'contain', opacity: 0.06, pointerEvents: 'none' }} />

          <div className="relative flex flex-col items-center text-center px-8 max-w-2xl z-10">
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-6" style={G}>Start today</motion.p>

            <div style={{ perspective: '700px' }}>
              <SplitText text="Ready to" base={0.05} step={0.1}
                style={{ ...G, fontSize: 'clamp(52px,7vw,96px)', color: '#1a1916', lineHeight: 1, display: 'block' }} />
              <SplitText text="level up?" base={0.25} step={0.1}
                style={{ ...G, fontSize: 'clamp(52px,7vw,96px)', color: '#1a1916', lineHeight: 1.05, display: 'block' }} />
            </div>

            <motion.p {...rise(0.5)} className="text-stone-400 mt-6 text-base leading-relaxed max-w-md" style={G}>
              Focus. Journal. Breathe. Play a game. Track your habits.
              Listen to music while you do it all. Free to start — always.
            </motion.p>

            <motion.div {...focus(0.6)} className="mt-10 flex flex-col items-center gap-5">
              <Link href="/signup" className="text-base text-white px-10 py-4 transition-colors" style={{ backgroundColor: '#1a1916', ...G, minWidth: 240, textAlign: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1916')}>
                Get started free
              </Link>
              <Link href="/login" className="text-sm text-stone-400 hover:text-stone-700 transition-colors" style={G}>
                Already a member? Sign in
              </Link>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.8 }}
            className="absolute bottom-8 text-xs text-stone-300" style={G}>
            Maable · Make life manageable
          </motion.p>
        </section>

      </div>
    </>
  )
}
