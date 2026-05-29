'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

// ─── Shared motion helpers ─────────────────────────────────────────────────────

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { type: 'spring' as const, stiffness: 220, damping: 24, delay },
})

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: 'easeOut' as const, delay },
})

// ─── Shared styles ────────────────────────────────────────────────────────────

const HEADING = { fontFamily: 'Georgia, serif', fontStyle: 'italic' } as const
const SUBTEXT = { fontFamily: 'Georgia, serif', fontStyle: 'italic' } as const

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 h-[4.5rem]"
      style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <span className="text-xl text-stone-900 select-none" style={HEADING}>
        Maable
      </span>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-4 py-2"
          style={SUBTEXT}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="text-sm text-white px-5 py-2.5 transition-colors"
          style={{ backgroundColor: '#1a1916', ...HEADING }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1916')}
        >
          Get started
        </Link>
      </div>
    </nav>
  )
}

// ─── Feature pill ─────────────────────────────────────────────────────────────

function Pill({ label }: { label: string }) {
  return (
    <span
      className="text-[11px] px-3 py-1 text-stone-500"
      style={{ backgroundColor: 'rgba(26,25,22,0.05)', ...SUBTEXT }}
    >
      {label}
    </span>
  )
}

// ─── Dark feature card (for section 5) ────────────────────────────────────────

function DarkCard({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) {
  return (
    <div
      className="flex flex-col p-6 relative overflow-hidden"
      style={{
        backgroundColor: '#0e0d0b',
        border: '1px solid rgba(201,168,76,0.14)',
        borderRadius: 4,
      }}
    >
      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
        }}
      />
      <p className="text-xs tracking-widest uppercase mb-2 relative" style={{ color: 'rgba(201,168,76,0.6)', ...SUBTEXT }}>
        {title}
      </p>
      <p className="text-sm leading-relaxed relative" style={{ color: 'rgba(255,255,255,0.55)', ...SUBTEXT }}>
        {sub}
      </p>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const CATEGORIES = [
    { id: 'career',  label: 'Career',        desc: 'Goals that compound'        },
    { id: 'student', label: 'Student',        desc: 'Deadlines, tamed'           },
    { id: 'hobbies', label: 'Hobbies',        desc: 'Make time for joy'          },
    { id: 'reading', label: 'Reading Corner', desc: 'Books & study in one place' },
    { id: 'lazy',    label: 'Feeling Lazy',   desc: 'Rest days count too'        },
  ]

  const XP_FEATURES = [
    { label: 'Earn XP for every task and habit you complete' },
    { label: 'Climb the global leaderboard and compete with friends' },
    { label: 'Your Chibi AI companion celebrates every win with you' },
    { label: 'Gamified profile: classes, achievements, battle log' },
  ]

  const NOTE_FEATURES = [
    { label: 'Rich notes with auto-save — always where you left off' },
    { label: 'One tap turns any note into a study flashcard deck' },
    { label: 'Revision Mode with spaced repetition surfaces the right card at the right time' },
  ]

  const FUN_FEATURES = [
    { label: 'Free-form corkboard — pin photos and sticky notes anywhere' },
    { label: 'Tic-Tac-Toe with friends: pass-and-play or real-time online' },
    { label: 'Spotify integration: now-playing card right on your dashboard' },
    { label: 'Connect integrations: Canvas LMS, Spotify, and more' },
  ]

  return (
    <>
      <Nav />

      <div
        style={{
          height: '100dvh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          backgroundColor: '#ffffff',
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
          section::-webkit-scrollbar { display: none; }
        `}</style>

        {/* ─── Section 1: Hero ──────────────────────────────────────────────── */}
        <section className="flex" style={{ height: '100dvh', scrollSnapAlign: 'start' }}>
          {/* Left */}
          <div
            className="flex flex-col justify-between"
            style={{ width: '52%', paddingLeft: '3.5rem', paddingRight: '3rem', paddingTop: '7rem', paddingBottom: '3.5rem' }}
          >
            <div>
              <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-6">
                Gamified productivity
              </motion.p>

              <motion.h1
                {...rise(0.07)}
                className="text-stone-900 leading-none"
                style={{ ...HEADING, fontSize: 'clamp(48px, 5.5vw, 80px)' }}
              >
                Make life<br />manageable.
              </motion.h1>

              <motion.p
                {...rise(0.14)}
                className="text-stone-500 mt-6 leading-relaxed max-w-md"
                style={{ ...SUBTEXT, fontSize: '1.125rem' }}
              >
                Tasks. Habits. Notes. Journal. Games. Spotify. XP.<br />
                The productivity app that actually feels like a reward.
              </motion.p>

              <motion.div {...rise(0.21)} className="flex items-center gap-4 mt-10">
                <Link
                  href="/signup"
                  className="text-sm text-white px-7 py-3.5 transition-colors"
                  style={{ backgroundColor: '#1a1916', ...HEADING }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1916')}
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-2"
                  style={SUBTEXT}
                >
                  Sign in →
                </Link>
              </motion.div>

              <motion.div {...rise(0.28)} className="flex flex-wrap gap-2 mt-8">
                {['Tasks & Habits', 'Notes & Flashcards', 'Journal', 'ADHD Mode', 'Breathing', 'Board', 'Games', 'Spotify', 'XP + Levels'].map(p => (
                  <Pill key={p} label={p} />
                ))}
              </motion.div>
            </div>

            {/* Bottom: stat strip */}
            <motion.div {...fadeIn(0.5)} className="flex items-end justify-between">
              <div className="flex gap-10">
                {[
                  { value: 'Free', label: 'to start' },
                  { value: 'XP',   label: 'for every action' },
                  { value: '9+',   label: 'features' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl text-stone-900 leading-none" style={HEADING}>{s.value}</p>
                    <p className="text-xs text-stone-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-300 tracking-widest" style={SUBTEXT}>scroll ↓</p>
            </motion.div>
          </div>

          {/* Right — avatar */}
          <div className="flex-1 flex items-end justify-center overflow-hidden" style={{ paddingTop: '4.5rem' }}>
            <motion.div {...fadeIn(0.1)} className="w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/avatar-user.png"
                alt="Maable"
                className="w-full h-full object-contain object-bottom"
                draggable={false}
              />
            </motion.div>
          </div>
        </section>

        {/* ─── Section 2: Categories ────────────────────────────────────────── */}
        <section
          className="flex flex-col justify-center"
          style={{ height: '100dvh', scrollSnapAlign: 'start', backgroundColor: '#faf9f7' }}
        >
          <div className="px-[90px] mb-10">
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-3">
              Five spaces
            </motion.p>
            <motion.h2 {...rise(0.07)} className="text-stone-900 leading-none" style={{ ...HEADING, fontSize: 'clamp(32px, 3.5vw, 52px)' }}>
              Your whole life, organized.
            </motion.h2>
            <motion.p {...rise(0.12)} className="text-stone-400 mt-3 text-sm max-w-sm">
              Every corner of your day has a home. Nothing falls through the cracks.
            </motion.p>
          </div>

          <div className="grid grid-cols-3 px-[90px] gap-6">
            {CATEGORIES.slice(0, 3).map((cat, i) => (
              <motion.div key={cat.id} {...rise(i * 0.07)} className="flex flex-col items-center">
                <div className="w-36 h-36 flex items-end justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/illustrations/category-${cat.id}.png`} alt={cat.label} className="w-full h-full object-contain" draggable={false} />
                </div>
                <p className="mt-3 text-sm text-stone-800" style={SUBTEXT}>{cat.label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{cat.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 px-[90px] mt-8 gap-6">
            {CATEGORIES.slice(3).map((cat, i) => (
              <motion.div
                key={cat.id} {...rise(0.21 + i * 0.07)}
                className="flex items-center gap-4 px-5 py-4"
                style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(26,25,22,0.06)' }}
              >
                <div className="w-16 h-16 flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/illustrations/category-${cat.id}.png`} alt={cat.label} className="w-full h-full object-contain" draggable={false} />
                </div>
                <div>
                  <p className="text-sm text-stone-800" style={SUBTEXT}>{cat.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{cat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── Section 3: Gamification ──────────────────────────────────────── */}
        <section className="flex" style={{ height: '100dvh', scrollSnapAlign: 'start' }}>
          <div
            className="flex items-end justify-center overflow-hidden shrink-0"
            style={{ width: '44%', paddingTop: '4.5rem' }}
          >
            <motion.div {...fadeIn(0.1)} className="w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/chibi-happy.png" alt="Chibi" className="w-full h-full object-contain object-bottom" draggable={false} />
            </motion.div>
          </div>

          <div className="flex-1 flex flex-col justify-center" style={{ paddingRight: '5rem', paddingLeft: '3rem' }}>
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-5">
              Levelling up
            </motion.p>
            <motion.h2 {...rise(0.07)} className="text-stone-900 leading-snug" style={{ ...HEADING, fontSize: 'clamp(30px, 3.2vw, 50px)' }}>
              Productivity that<br />feels like a game.
            </motion.h2>
            <motion.p {...rise(0.14)} className="text-stone-400 mt-4 text-sm leading-relaxed max-w-sm">
              We turned the boring parts of being productive into something
              you&apos;ll actually look forward to.
            </motion.p>

            <ul className="mt-8 space-y-4">
              {XP_FEATURES.map((f, i) => (
                <motion.li key={f.label} {...rise(0.21 + i * 0.07)} className="flex items-start gap-3">
                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-700 shrink-0" />
                  <p className="text-sm text-stone-600 leading-relaxed" style={SUBTEXT}>{f.label}</p>
                </motion.li>
              ))}
            </ul>

            <motion.div {...rise(0.5)} className="mt-10">
              <Link
                href="/signup"
                className="inline-block text-sm text-white px-7 py-3.5 transition-colors"
                style={{ backgroundColor: '#1a1916', ...HEADING }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1916')}
              >
                Start earning XP
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── Section 4: Notes + Revision ─────────────────────────────────── */}
        <section className="flex" style={{ height: '100dvh', scrollSnapAlign: 'start', backgroundColor: '#faf9f7' }}>
          <div
            className="flex flex-col justify-center"
            style={{ width: '52%', paddingLeft: '5rem', paddingRight: '3rem', paddingTop: '4.5rem' }}
          >
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-5">
              Notes & revision
            </motion.p>
            <motion.h2 {...rise(0.07)} className="text-stone-900 leading-snug" style={{ ...HEADING, fontSize: 'clamp(30px, 3.2vw, 50px)' }}>
              Write. Study.<br />Remember.
            </motion.h2>
            <motion.p {...rise(0.14)} className="text-stone-400 mt-4 text-sm leading-relaxed max-w-sm">
              Your notes don&apos;t just sit there. One tap turns them into
              flashcards. Revision Mode makes sure the right card finds you at
              the right time.
            </motion.p>

            <ul className="mt-8 space-y-4">
              {NOTE_FEATURES.map((f, i) => (
                <motion.li key={f.label} {...rise(0.21 + i * 0.07)} className="flex items-start gap-3">
                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-700 shrink-0" />
                  <p className="text-sm text-stone-600 leading-relaxed" style={SUBTEXT}>{f.label}</p>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex-1 flex items-end justify-center overflow-hidden" style={{ paddingTop: '4.5rem' }}>
            <motion.div {...fadeIn(0.1)} className="w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/category-reading.png" alt="Reading" className="w-full h-full object-contain object-bottom" draggable={false} />
            </motion.div>
          </div>
        </section>

        {/* ─── Section 5: Focus & Wellbeing ────────────────────────────────── */}
        <section
          className="flex flex-col justify-center"
          style={{ height: '100dvh', scrollSnapAlign: 'start', backgroundColor: '#0e0d0b' }}
        >
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)',
            }}
          />

          <div className="relative px-[90px]">
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(201,168,76,0.6)' }}>
              Focus & wellbeing
            </motion.p>
            <motion.h2
              {...rise(0.07)}
              className="leading-none mb-3"
              style={{ ...HEADING, color: 'rgba(255,255,255,0.88)', fontSize: 'clamp(32px, 3.5vw, 52px)' }}
            >
              Built for the way<br />your brain actually works.
            </motion.h2>
            <motion.p {...rise(0.12)} className="text-sm leading-relaxed max-w-md mb-12" style={{ color: 'rgba(255,255,255,0.38)', ...SUBTEXT }}>
              From daily journaling to ADHD-friendly typing effects — tools that meet you where you are,
              not where productivity gurus think you should be.
            </motion.p>

            <div className="grid grid-cols-2 gap-4 max-w-3xl">
              <motion.div {...rise(0.14)}>
                <DarkCard
                  title="ADHD Mode"
                  sub="Watch every key you type float up from your cursor — ridiculous_coding style. Combo counter, screen shake, milestone bursts."
                />
              </motion.div>
              <motion.div {...rise(0.2)}>
                <DarkCard
                  title="Breathwork"
                  sub="Box breathing, 4-7-8, Wim Hof. A minimal animated circle with no numbers, just rhythm."
                />
              </motion.div>
              <motion.div {...rise(0.26)}>
                <DarkCard
                  title="Daily Journal"
                  sub="Private date-based journal with mood tracker, writing prompts, streak, and a mini calendar view."
                />
              </motion.div>
              <motion.div {...rise(0.32)}>
                <DarkCard
                  title="Architect Mode"
                  sub="Drag and resize every card on your dashboard. Make it yours. Layout persists across sessions."
                />
              </motion.div>
            </div>

            <motion.div {...rise(0.4)} className="mt-10">
              <Link
                href="/signup"
                className="inline-block text-sm px-7 py-3.5 transition-colors"
                style={{ backgroundColor: '#c9a84c', color: '#0e0d0b', ...HEADING }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e2c068')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c9a84c')}
              >
                Try it free
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── Section 6: Create, Play & Connect ───────────────────────────── */}
        <section className="flex" style={{ height: '100dvh', scrollSnapAlign: 'start', backgroundColor: '#faf9f7' }}>
          {/* Left — text */}
          <div
            className="flex flex-col justify-center"
            style={{ width: '50%', paddingLeft: '5rem', paddingRight: '3rem', paddingTop: '4.5rem' }}
          >
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-5">
              Create, play & connect
            </motion.p>
            <motion.h2 {...rise(0.07)} className="text-stone-900 leading-snug" style={{ ...HEADING, fontSize: 'clamp(30px, 3.2vw, 50px)' }}>
              More than a<br />task manager.
            </motion.h2>
            <motion.p {...rise(0.14)} className="text-stone-400 mt-4 text-sm leading-relaxed max-w-sm">
              Maable has a corkboard for your aesthetic, games to play with friends,
              and Spotify so the music never has to stop.
            </motion.p>

            <ul className="mt-8 space-y-4">
              {FUN_FEATURES.map((f, i) => (
                <motion.li key={f.label} {...rise(0.21 + i * 0.07)} className="flex items-start gap-3">
                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-700 shrink-0" />
                  <p className="text-sm text-stone-600 leading-relaxed" style={SUBTEXT}>{f.label}</p>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Right — bento preview */}
          <div
            className="flex-1 flex flex-col justify-center gap-3 pr-12"
            style={{ paddingTop: '4.5rem', paddingBottom: '4.5rem' }}
          >
            {/* Corkboard mock */}
            <motion.div
              {...rise(0.1)}
              className="relative flex-1 overflow-hidden"
              style={{
                backgroundColor: '#ede8e0',
                backgroundImage: 'radial-gradient(circle, rgba(26,25,22,0.08) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                borderRadius: 4,
                border: '1px solid rgba(26,25,22,0.1)',
              }}
            >
              {/* Fake pins */}
              {[
                { x: '15%', y: '20%', color: '#c9a84c', rot: -5 },
                { x: '55%', y: '15%', color: '#e07c5d', rot:  3 },
                { x: '30%', y: '55%', color: '#6b8fa0', rot: -2 },
              ].map((pin, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: pin.x, top: pin.y,
                    width: 70, height: 80,
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    boxShadow: '2px 3px 8px rgba(0,0,0,0.15)',
                    transform: `rotate(${pin.rot}deg)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12,
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: pin.color, marginBottom: 6 }} />
                  <div style={{ width: '70%', height: 3, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 2, marginBottom: 4 }} />
                  <div style={{ width: '50%', height: 3, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2 }} />
                </div>
              ))}
              <p
                className="absolute bottom-3 left-0 right-0 text-center text-xs pointer-events-none"
                style={{ color: 'rgba(26,25,22,0.25)', ...SUBTEXT }}
              >
                the board
              </p>
            </motion.div>

            {/* Bottom row: game + spotify */}
            <div className="flex gap-3 shrink-0" style={{ height: 90 }}>
              {/* TTT preview */}
              <motion.div
                {...rise(0.18)}
                className="flex-1 flex items-center justify-center gap-3"
                style={{
                  backgroundColor: '#1a1916',
                  borderRadius: 4,
                  border: '1px solid rgba(201,168,76,0.15)',
                }}
              >
                <div className="grid grid-cols-3 gap-1">
                  {['✕','○','✕','','○','','○','','✕'].map((c, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 flex items-center justify-center text-xs"
                      style={{
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: c === '✕' ? '#c9a84c' : 'rgba(255,255,255,0.5)',
                        borderRadius: 1,
                        ...HEADING,
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', ...SUBTEXT }}>games</p>
              </motion.div>

              {/* Spotify mock */}
              <motion.div
                {...rise(0.24)}
                className="flex-1 flex items-center gap-3 px-4"
                style={{
                  backgroundColor: '#141210',
                  borderRadius: 4,
                  border: '1px solid rgba(29,185,84,0.2)',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 3, backgroundColor: 'rgba(29,185,84,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M17.2 10.8c-3-1.8-8-1.9-10.8-1.1-.5.1-.9-.2-1-.6-.1-.5.2-.9.6-1C9 7.1 14.5 7.2 18 9.3c.4.2.5.7.3 1.1-.3.4-.7.6-1.1.4zm-.1 2.9c-.3.4-.8.5-1.2.3-2.5-1.5-6.3-2-9.2-1.1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.4-.9 7.5-.5 10.4 1.3.4.3.5.8.5 1zm-1.3 2.8c-.2.3-.6.5-1 .3-2.2-1.3-5-1.6-8.2-.9-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 3.6-.8 6.7-.5 9.2 1 .3.3.4.6.3.9z" fill="#1db954" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)', ...SUBTEXT }}>now playing</p>
                  <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)', ...SUBTEXT }}>on your dashboard</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── Section 7: Skins ────────────────────────────────────────────── */}
        <section
          className="flex flex-col justify-center relative overflow-hidden"
          style={{ height: '100dvh', scrollSnapAlign: 'start', backgroundColor: '#0a0908' }}
        >
          {/* Subtle noise grain */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.006) 3px, rgba(255,255,255,0.006) 4px)',
          }} />

          <div className="relative px-[90px]">
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(201,168,76,0.55)' }}>
              coming soon
            </motion.p>
            <motion.h2 {...rise(0.07)} className="leading-none mb-3" style={{ ...HEADING, color: 'rgba(255,255,255,0.88)', fontSize: 'clamp(30px, 3.5vw, 52px)' }}>
              Skins. Your vibe,<br />your Maable.
            </motion.h2>
            <motion.p {...rise(0.12)} className="text-sm mb-10 max-w-md" style={{ ...SUBTEXT, color: 'rgba(255,255,255,0.35)', lineHeight: '1.7' }}>
              Niche aesthetics dropping as unlockable skins. Earn them with XP or unlock with achievements.
            </motion.p>

            <div className="grid grid-cols-5 gap-4">

              {/* Cybercore */}
              <motion.div {...rise(0.14)} className="flex flex-col" style={{ gap: 10 }}>
                <div style={{
                  height: 160, borderRadius: 4, overflow: 'hidden', position: 'relative',
                  backgroundColor: '#05050f',
                  border: '1px solid rgba(0,255,255,0.25)',
                  boxShadow: '0 0 20px rgba(0,255,255,0.08)',
                }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
                    <div style={{ height: 6, backgroundColor: 'rgba(0,255,255,0.15)', borderRadius: 1, marginBottom: 5 }} />
                    <div style={{ height: 4, width: '65%', backgroundColor: 'rgba(0,255,255,0.10)', borderRadius: 1, marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 32, backgroundColor: 'rgba(0,255,255,0.06)', border: '1px solid rgba(0,255,255,0.18)', borderRadius: 2 }} />)}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, height: 2, background: 'linear-gradient(90deg, #00ffff, transparent)' }} />
                  <div style={{ position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00ffff', boxShadow: '0 0 8px #00ffff' }} />
                </div>
                <p style={{ ...HEADING, fontSize: '0.72rem', color: 'rgba(255,255,255,0.60)' }}>Cybercore</p>
                <p style={{ ...SUBTEXT, fontSize: '0.60rem', color: 'rgba(255,255,255,0.28)', marginTop: -6 }}>Neon grid, terminal glow</p>
              </motion.div>

              {/* Acid Design */}
              <motion.div {...rise(0.19)} className="flex flex-col" style={{ gap: 10 }}>
                <div style={{
                  height: 160, borderRadius: 4, overflow: 'hidden', position: 'relative',
                  backgroundColor: '#c8ff00',
                  border: '1px solid rgba(0,0,0,0.15)',
                }}>
                  <div style={{ position: 'absolute', top: 14, left: 14, right: 14 }}>
                    <div style={{ height: 8, backgroundColor: '#ff00c8', borderRadius: 40, marginBottom: 8 }} />
                    <div style={{ height: 5, width: '70%', backgroundColor: '#7b00ff', borderRadius: 40, marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ flex: 2, height: 38, backgroundColor: '#ff00c8', borderRadius: 40 }} />
                      <div style={{ flex: 1, height: 38, backgroundColor: '#00c8ff', borderRadius: 40 }} />
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: '1.4rem', lineHeight: 1 }}>✦</div>
                </div>
                <p style={{ ...HEADING, fontSize: '0.72rem', color: 'rgba(255,255,255,0.60)' }}>Acid Design</p>
                <p style={{ ...SUBTEXT, fontSize: '0.60rem', color: 'rgba(255,255,255,0.28)', marginTop: -6 }}>Psychedelic, wobbly, loud</p>
              </motion.div>

              {/* Shibuya Punk */}
              <motion.div {...rise(0.24)} className="flex flex-col" style={{ gap: 10 }}>
                <div style={{
                  height: 160, borderRadius: 4, overflow: 'hidden', position: 'relative',
                  backgroundColor: '#0d0006',
                  border: '1px solid rgba(255,20,147,0.30)',
                }}>
                  <div style={{ position: 'absolute', top: 10, left: 10, right: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.55rem', color: '#ff1493', letterSpacing: '0.2em', fontFamily: 'monospace' }}>渋谷</span>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #ff1493' }} />
                    </div>
                    <div style={{ height: 5, backgroundColor: 'rgba(255,20,147,0.25)', borderRadius: 1, marginBottom: 4 }} />
                    <div style={{ height: 3, width: '45%', backgroundColor: 'rgba(255,20,147,0.15)', borderRadius: 1, marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 28, backgroundColor: 'rgba(255,20,147,0.08)', border: '1px solid rgba(255,20,147,0.20)', borderRadius: 2 }} />)}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, height: 1, backgroundColor: 'rgba(255,20,147,0.30)' }} />
                </div>
                <p style={{ ...HEADING, fontSize: '0.72rem', color: 'rgba(255,255,255,0.60)' }}>Shibuya Punk</p>
                <p style={{ ...SUBTEXT, fontSize: '0.60rem', color: 'rgba(255,255,255,0.28)', marginTop: -6 }}>Tokyo street, hot pink</p>
              </motion.div>

              {/* ASCII Art */}
              <motion.div {...rise(0.29)} className="flex flex-col" style={{ gap: 10 }}>
                <div style={{
                  height: 160, borderRadius: 4, overflow: 'hidden', position: 'relative',
                  backgroundColor: '#080800',
                  border: '1px solid rgba(0,255,65,0.20)',
                }}>
                  <div style={{ position: 'absolute', inset: 0, padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.45rem', color: 'rgba(0,255,65,0.55)', lineHeight: 1.5, overflow: 'hidden' }}>
                    <div>{'╔═══════════════╗'}</div>
                    <div>{'║  MAABLE v1.0  ║'}</div>
                    <div>{'╠═══════════════╣'}</div>
                    <div style={{ color: 'rgba(0,255,65,0.85)' }}>{'> TASK: workout  ✓'}</div>
                    <div>{'> HABIT: journal ✓'}</div>
                    <div>{'> XP: +150 ████░'}</div>
                    <div style={{ color: 'rgba(0,255,65,0.40)' }}>{'╚═══════════════╝'}</div>
                    <div style={{ color: 'rgba(0,255,65,0.35)' }}>{'_                '}</div>
                  </div>
                </div>
                <p style={{ ...HEADING, fontSize: '0.72rem', color: 'rgba(255,255,255,0.60)' }}>ASCII Art</p>
                <p style={{ ...SUBTEXT, fontSize: '0.60rem', color: 'rgba(255,255,255,0.28)', marginTop: -6 }}>Terminal, retro, monospace</p>
              </motion.div>

              {/* Kawaii */}
              <motion.div {...rise(0.34)} className="flex flex-col" style={{ gap: 10 }}>
                <div style={{
                  height: 160, borderRadius: 4, overflow: 'hidden', position: 'relative',
                  backgroundColor: '#fff0f8',
                  border: '1px solid rgba(255,133,194,0.30)',
                }}>
                  <div style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
                    <div style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: 6 }}>🌸</div>
                    <div style={{ height: 6, backgroundColor: 'rgba(255,133,194,0.30)', borderRadius: 40, marginBottom: 6 }} />
                    <div style={{ height: 4, width: '55%', margin: '0 auto', backgroundColor: 'rgba(255,133,194,0.20)', borderRadius: 40, marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 28, backgroundColor: 'rgba(255,133,194,0.12)', border: '1px solid rgba(255,133,194,0.25)', borderRadius: 20 }} />)}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: '0.65rem' }}>✨🌙</div>
                </div>
                <p style={{ ...HEADING, fontSize: '0.72rem', color: 'rgba(255,255,255,0.60)' }}>Kawaii</p>
                <p style={{ ...SUBTEXT, fontSize: '0.60rem', color: 'rgba(255,255,255,0.28)', marginTop: -6 }}>Pastel, soft, cute</p>
              </motion.div>

            </div>

            <motion.p {...rise(0.42)} className="mt-8 text-xs" style={{ ...SUBTEXT, color: 'rgba(201,168,76,0.40)' }}>
              Unlock skins by levelling up or completing achievements — no purchases required.
            </motion.p>
          </div>
        </section>

        {/* ─── Section 8: Final CTA ─────────────────────────────────────────── */}
        <section
          className="flex flex-col items-center justify-center relative overflow-hidden"
          style={{ height: '100dvh', scrollSnapAlign: 'start' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/chibi-calm.png"
            alt=""
            className="absolute bottom-0 right-0 h-[70%] object-contain object-bottom opacity-[0.06] pointer-events-none"
            draggable={false}
            aria-hidden
          />

          <div className="relative flex flex-col items-center text-center px-8 max-w-2xl">
            <motion.p {...rise(0)} className="text-xs tracking-widest uppercase text-stone-400 mb-6">
              Start today
            </motion.p>

            <motion.h2
              {...rise(0.07)}
              className="text-stone-900 leading-none"
              style={{ ...HEADING, fontSize: 'clamp(56px, 7vw, 100px)' }}
            >
              Ready to level up?
            </motion.h2>

            <motion.p {...rise(0.14)} className="text-stone-400 mt-6 text-base leading-relaxed max-w-md">
              Journal your day. Breathe. Play a game. Track your habits.
              Listen to music while you do it all. Free to start.
            </motion.p>

            <motion.div {...rise(0.21)} className="mt-10 flex flex-col items-center gap-5">
              <Link
                href="/signup"
                className="text-base text-white px-10 py-4 transition-colors"
                style={{ backgroundColor: '#1a1916', ...HEADING, minWidth: 240, textAlign: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1916')}
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
                style={SUBTEXT}
              >
                Already a member? Sign in
              </Link>
            </motion.div>
          </div>

          <motion.p
            {...fadeIn(0.5)}
            className="absolute bottom-8 text-xs text-stone-300"
            style={SUBTEXT}
          >
            Maable · Make life manageable
          </motion.p>
        </section>
      </div>
    </>
  )
}
