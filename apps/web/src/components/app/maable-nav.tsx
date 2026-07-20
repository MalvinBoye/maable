'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Profile } from '@maable/core'
import { TutorialDrawer } from '@/components/app/tutorial-drawer'
import { BreathingModal } from '@/components/app/breathing-modal'
import { AvatarDisplay } from '@/components/app/avatar-builder'
import { NotificationPanel } from '@/components/app/notification-panel'
import { useADHD } from '@/lib/adhd-context'
import { useArchitect } from '@/lib/architect-context'
import { useSimpleMode } from '@/lib/simple-mode-context'

const NAV_SECTIONS = [
  {
    label: 'explore',
    items: [
      { label: 'Home',       href: '/dashboard',  icon: '⌂' },
      { label: 'Mood Board', href: '/moodboard',  icon: '◫' },
      { label: 'Tasks',      href: '/tasks',      icon: '◎' },
      { label: 'Habits',     href: '/habits',     icon: '◈' },
      { label: 'Notes',      href: '/notes',      icon: '✦' },
      { label: 'Schedule',   href: '/schedule',   icon: '⊟' },
    ],
  },
  {
    label: 'grow',
    items: [
      { label: 'Student',  href: '/student',     icon: '◑' },
      { label: 'Career',   href: '/career',      icon: '▲' },
      { label: 'Hobbies',  href: '/hobbies',     icon: '◇' },
      { label: 'Journal',  href: '/journal',     icon: '✎' },
      { label: 'Games',    href: '/games',       icon: '⊞' },
    ],
  },
  {
    label: 'connect',
    items: [
      { label: 'Connect',     href: '/connect',     icon: '⊕' },
      { label: 'Leaderboard', href: '/leaderboard', icon: '◆' },
      { label: 'Profile',     href: '/profile',     icon: '◐' },
      { label: 'Settings',    href: '/settings',    icon: '⊟' },
    ],
  },
]

const GREETINGS: Record<'morning' | 'afternoon' | 'evening', string[]> = {
  morning: ['Rise and grind,', 'Good morning,', 'Ready to own the day,', "Let's go,"],
  afternoon: ['Keep pushing,', 'Good afternoon,', 'Still going strong,', 'Halfway there,'],
  evening: ['Finish strong,', 'Good evening,', 'One more push,', 'Wind down,'],
}

function buildGreeting(name: string) {
  const hour = new Date().getHours()
  const period: 'morning' | 'afternoon' | 'evening' =
    hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  const opts = GREETINGS[period]
  const prefix = opts[Math.floor(Math.random() * opts.length)] ?? opts[0]!
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  return { line1: `${prefix} ${name}`, line2: date }
}

interface MaableNavProps {
  profile: Profile | null
  notificationCount?: number
  /** @deprecated use notificationCount */
  hasNotifications?: boolean
}

export function MaableNav({ profile, notificationCount = 0, hasNotifications = false }: MaableNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [breathingOpen, setBreathingOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifSeen, setNotifSeen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/dashboard'
  const displayName = profile?.display_name ?? 'User'
  const [greeting] = useState(() => buildGreeting(displayName))
  const { adhdMode, ultraMode, adhdLevel, toggleADHD } = useADHD()
  const { simpleMode, toggleSimpleMode } = useSimpleMode()
  useArchitect()

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [menuOpen])

  const xpProgress = profile ? ((profile.total_xp % 1000) / 1000) * 100 : 0

  return (
    <>
      {/* ── White top bar ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 h-[4.5rem]"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center gap-4">
          {!isHome ? (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 group"
              aria-label="Go back"
            >
              <span
                className="text-stone-400 group-hover:text-stone-800 transition-colors"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.25rem', lineHeight: 1 }}
              >
                ←
              </span>
              <span
                className="text-sm text-stone-400 group-hover:text-stone-800 transition-colors"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                back
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setMenuOpen(true)}
                className="flex flex-col gap-[5px] group shrink-0 p-1"
                aria-label="Open menu"
              >
                <span className="block w-5 h-[2px] bg-stone-700 rounded-full transition-all group-hover:w-6" />
                <span className="block w-6 h-[2px] bg-stone-700 rounded-full" />
                <span className="block w-4 h-[2px] bg-stone-700 rounded-full transition-all group-hover:w-6" />
              </button>

              <div className="leading-tight">
                <p className="text-sm text-stone-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {greeting.line1}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">{greeting.line2}</p>
              </div>
            </>
          )}
        </div>

        <Link
          href="/dashboard"
          className="absolute left-1/2 -translate-x-1/2 text-xl text-stone-900 select-none hover:text-stone-500 transition-colors"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Maable
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/schedule" className="flex items-center gap-2 group" aria-label="Schedule">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/icon-calendar.png"
              alt=""
              className="w-9 h-9 object-contain opacity-75 group-hover:opacity-100 transition-opacity"
              draggable={false}
            />
            <span
              className="text-sm text-stone-500 group-hover:text-stone-900 transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Schedule
            </span>
          </Link>

          <TutorialDrawer />

          {/* Focus mode indicator pill */}
          {simpleMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => { toggleSimpleMode() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(26,25,22,0.06)',
                border: '1px solid rgba(26,25,22,0.12)',
                borderRadius: 20, padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#c9a84c', flexShrink: 0 }}
              />
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(26,25,22,0.55)' }}>
                focus
              </span>
            </motion.button>
          )}

          {/* ADHD mode quick toggle */}
          <motion.button
            onClick={toggleADHD}
            title={`ADHD mode: ${adhdLevel} — click to cycle`}
            aria-label="Toggle ADHD mode"
            whileTap={{ scale: 0.92 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              border: `1px solid ${ultraMode ? 'rgba(255,0,255,0.35)' : adhdMode ? 'rgba(255,153,102,0.35)' : 'rgba(26,25,22,0.10)'}`,
              backgroundColor: ultraMode ? 'rgba(255,0,255,0.06)' : adhdMode ? 'rgba(255,153,102,0.07)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            <span style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem',
              color: ultraMode ? '#ff00ff' : adhdMode ? '#ff9966' : 'rgba(26,25,22,0.35)',
            }}>
              {adhdLevel === 'off' ? 'adhd' : adhdLevel}
            </span>
          </motion.button>

          {/* Breathing button */}
          <button
            onClick={() => setBreathingOpen(true)}
            className="flex items-center gap-1.5 group"
            aria-label="Breathing exercise"
            title="Breathing exercise"
          >
            <span
              className="text-stone-400 group-hover:text-stone-800 transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.1rem' }}
            >
              ◯
            </span>
            <span
              className="text-sm text-stone-400 group-hover:text-stone-800 transition-colors hidden sm:block"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              breathe
            </span>
          </button>

          <div className="relative">
            <button
              className="relative group"
              aria-label="Notifications"
              onClick={() => setNotifOpen(o => !o)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/icon-eh.png"
                alt="eh?"
                className="h-8 object-contain opacity-75 group-hover:opacity-100 transition-opacity"
                draggable={false}
              />
              {(notificationCount > 0 || hasNotifications) && !notifSeen && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
            <NotificationPanel
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              onRead={() => setNotifSeen(true)}
            />
          </div>

          <Link href="/profile" aria-label="Profile">
            <div className="w-11 h-11 rounded-full border border-stone-200 overflow-hidden hover:border-stone-400 transition-colors flex items-center justify-center" style={{ backgroundColor: '#0a0908' }}>
              <AvatarDisplay avatarUrl={profile?.avatar_url} size={44} />
            </div>
          </Link>
        </div>
      </header>

      {/* ── Game pause menu ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40"
              style={{
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                backgroundColor: 'rgba(4,3,2,0.92)',
              }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4"
            >
              <div
                className="pointer-events-auto relative flex flex-col overflow-hidden"
                style={{
                  backgroundColor: '#0a0908',
                  border: '1px solid rgba(201,168,76,0.22)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 48px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(201,168,76,0.06)',
                  borderRadius: 6,
                  width: 'min(96vw, 880px)',
                  maxHeight: '90vh',
                }}
              >
                {/* Gold corner marks */}
                {(['tl','tr','bl','br'] as const).map(c => (
                  <div
                    key={c}
                    style={{
                      position: 'absolute',
                      width: 14, height: 14,
                      top:    c.startsWith('t') ? -1 : undefined,
                      bottom: c.startsWith('b') ? -1 : undefined,
                      left:   c.endsWith('l')   ? -1 : undefined,
                      right:  c.endsWith('r')   ? -1 : undefined,
                      borderTop:    c.startsWith('t') ? '2px solid #c9a84c' : 'none',
                      borderBottom: c.startsWith('b') ? '2px solid #c9a84c' : 'none',
                      borderLeft:   c.endsWith('l')   ? '2px solid #c9a84c' : 'none',
                      borderRight:  c.endsWith('r')   ? '2px solid #c9a84c' : 'none',
                      borderRadius: c === 'tl' ? '6px 0 0 0' : c === 'tr' ? '0 6px 0 0' : c === 'bl' ? '0 0 0 6px' : '0 0 6px 0',
                      zIndex: 20,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Subtle scanline overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
                    zIndex: 1,
                  }}
                />

                {/* ── Top bar ─────────────────────────────────────────────────── */}
                <div
                  className="relative flex items-center justify-between px-7 py-3"
                  style={{
                    borderBottom: '1px solid rgba(201,168,76,0.14)',
                    zIndex: 2,
                  }}
                >
                  <p style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: '1.35rem',
                    color: '#c9a84c',
                    letterSpacing: '-0.01em',
                  }}>
                    Maable
                  </p>
                  <div className="flex items-center gap-6">
                    <span style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.40)', fontFamily: 'Georgia, serif' }}>
                      menu
                    </span>
                    <button
                      onClick={() => setMenuOpen(false)}
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)' }}
                    >
                      esc · resume
                    </button>
                  </div>
                </div>

                {/* ── Body ────────────────────────────────────────────────────── */}
                <div
                  className="relative flex flex-col md:flex-row overflow-y-auto"
                  style={{ zIndex: 2, scrollbarWidth: 'none', maxHeight: 'calc(90vh - 50px)' }}
                >

                  {/* Left panel — player stat sheet */}
                  <div
                    className="flex flex-col gap-0 shrink-0"
                    style={{
                      width: 'clamp(200px, 30%, 260px)',
                      borderRight: '1px solid rgba(201,168,76,0.12)',
                      backgroundColor: 'rgba(0,0,0,0.22)',
                    }}
                  >
                    {/* Player card */}
                    {profile && (
                      <div className="flex flex-col gap-4 p-6 pb-5">
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 52, height: 52,
                              borderRadius: 4,
                              overflow: 'hidden',
                              border: '1px solid rgba(201,168,76,0.28)',
                              flexShrink: 0,
                              backgroundColor: '#0a0908',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <AvatarDisplay avatarUrl={profile.avatar_url} size={52} />
                          </div>
                          <div className="min-w-0">
                            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.2 }} className="truncate">
                              {displayName}
                            </p>
                            <p style={{ fontSize: '0.68rem', color: 'rgba(201,168,76,0.65)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
                              Level {profile.level}
                            </p>
                          </div>
                        </div>

                        {/* Stat rows */}
                        <div className="flex flex-col gap-2">
                          <div style={{ height: 1, backgroundColor: 'rgba(201,168,76,0.10)' }} />
                          <div className="flex items-center justify-between">
                            <span style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontFamily: 'Georgia, serif' }}>exp</span>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                              {profile.total_xp.toLocaleString()} xp
                            </span>
                          </div>
                          {/* XP bar — game HP-bar style */}
                          <div style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                            <motion.div
                              style={{ height: '100%', backgroundColor: '#c9a84c', borderRadius: 1 }}
                              initial={{ width: 0 }}
                              animate={{ width: `${xpProgress}%` }}
                              transition={{ delay: 0.15, duration: 0.9, ease: 'easeOut' }}
                            />
                          </div>
                          <p style={{ fontSize: '0.60rem', color: 'rgba(201,168,76,0.35)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                            {Math.round(xpProgress)}% to next level
                          </p>
                          <div style={{ height: 1, backgroundColor: 'rgba(201,168,76,0.10)' }} />
                        </div>
                      </div>
                    )}

                    {/* Mode toggles */}
                    <div className="flex flex-col gap-0 mt-auto">
                      <div style={{ borderTop: '1px solid rgba(201,168,76,0.10)' }} />
                      <p style={{ fontSize: '0.58rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)', padding: '10px 24px 6px', fontFamily: 'Georgia, serif' }}>
                        modes
                      </p>

                      {/* Focus Mode */}
                      <button
                        onClick={() => { setMenuOpen(false); setTimeout(toggleSimpleMode, 120) }}
                        className="flex items-center justify-between px-6 py-3 transition-all"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.span
                            animate={simpleMode ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                            transition={simpleMode ? { repeat: Infinity, duration: 2 } : {}}
                            style={{ fontSize: '0.9rem', color: simpleMode ? '#c9a84c' : 'rgba(255,255,255,0.28)' }}
                          >
                            {simpleMode ? '◉' : '◎'}
                          </motion.span>
                          <div className="flex flex-col gap-0.5">
                            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: simpleMode ? '#c9a84c' : 'rgba(255,255,255,0.45)' }}>
                              Focus Mode
                            </span>
                            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)' }}>
                              Strip to the essentials
                            </span>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: simpleMode ? '#c9a84c' : 'rgba(255,255,255,0.20)',
                          fontFamily: 'Georgia, serif',
                          border: `1px solid ${simpleMode ? 'rgba(201,168,76,0.50)' : 'rgba(255,255,255,0.10)'}`,
                          padding: '1px 5px', borderRadius: 2,
                        }}>
                          {simpleMode ? 'on' : 'off'}
                        </span>
                      </button>

                      {/* ADHD Mode */}
                      <button
                        onClick={() => { toggleADHD(); setMenuOpen(false) }}
                        className="flex items-center justify-between px-6 py-3 transition-all"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: '0.9rem', color: ultraMode ? '#ff00ff' : adhdMode ? '#ff9966' : 'rgba(255,255,255,0.28)' }}>
                            {ultraMode ? '◉' : '◌'}
                          </span>
                          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: ultraMode ? '#ff00ff' : adhdMode ? '#ff9966' : 'rgba(255,255,255,0.45)' }}>
                            ADHD Mode
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: ultraMode ? '#ff00ff' : adhdMode ? '#ff9966' : 'rgba(255,255,255,0.20)',
                          fontFamily: 'Georgia, serif',
                          border: `1px solid ${ultraMode ? 'rgba(255,0,255,0.50)' : adhdMode ? 'rgba(255,153,102,0.40)' : 'rgba(255,255,255,0.10)'}`,
                          padding: '1px 5px', borderRadius: 2,
                        }}>
                          {adhdLevel}
                        </span>
                      </button>

                      {/* Breathe */}
                      <button
                        onClick={() => { setMenuOpen(false); setBreathingOpen(true) }}
                        className="flex items-center justify-between px-6 py-3 transition-all"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.28)' }}>◯</span>
                          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                            Breathe
                          </span>
                        </div>
                        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>→</span>
                      </button>

                      {/* Architect — coming soon */}
                      <div
                        className="flex items-center justify-between px-6 py-3"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', opacity: 0.45, cursor: 'default' }}
                      >
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.28)' }}>⊞</span>
                          <div className="flex flex-col gap-0.5">
                            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                              Architect
                            </span>
                            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)' }}>
                              Drag &amp; rearrange your dashboard
                            </span>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: 'rgba(201,168,76,0.55)',
                          fontFamily: 'Georgia, serif',
                          border: '1px solid rgba(201,168,76,0.25)',
                          padding: '1px 5px', borderRadius: 2,
                        }}>
                          Soon
                        </span>
                      </div>

                      <div style={{ height: 24 }} />
                    </div>
                  </div>

                  {/* Right panel — navigation */}
                  <div className="flex-1 p-7 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex flex-col gap-7">
                      {NAV_SECTIONS.map((section, si) => (
                        <div key={section.label}>
                          {/* Section label */}
                          <div className="flex items-center gap-3 mb-3">
                            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.14)' }} />
                            <span style={{
                              fontSize: '0.60rem',
                              letterSpacing: '0.24em',
                              textTransform: 'uppercase',
                              color: 'rgba(201,168,76,0.50)',
                              fontFamily: 'Georgia, serif',
                              flexShrink: 0,
                            }}>
                              {section.label}
                            </span>
                            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.14)' }} />
                          </div>

                          {/* Items grid */}
                          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                            {section.items.map((item, ii) => {
                              const isActive = pathname === item.href
                              return (
                                <motion.div
                                  key={item.href}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: si * 0.05 + ii * 0.03 }}
                                >
                                  <Link
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 transition-all group"
                                    style={{
                                      fontFamily: 'Georgia, serif',
                                      fontStyle: 'italic',
                                      fontSize: '0.95rem',
                                      color: isActive ? '#c9a84c' : 'rgba(255,255,255,0.40)',
                                      backgroundColor: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                                      border: `1px solid ${isActive ? 'rgba(201,168,76,0.18)' : 'transparent'}`,
                                      borderRadius: 4,
                                    }}
                                    onMouseEnter={e => {
                                      if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                                      }
                                    }}
                                    onMouseLeave={e => {
                                      if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.40)'
                                        e.currentTarget.style.borderColor = 'transparent'
                                      }
                                    }}
                                  >
                                    <span style={{ fontSize: '1rem', opacity: isActive ? 1 : 0.5, color: isActive ? '#c9a84c' : 'inherit', flexShrink: 0 }}>
                                      {item.icon}
                                    </span>
                                    <span className="flex-1">{item.label}</span>
                                    {isActive && (
                                      <span style={{ fontSize: '0.5rem', color: '#c9a84c', flexShrink: 0 }}>◆</span>
                                    )}
                                  </Link>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Breathing modal */}
      <AnimatePresence>
        {breathingOpen && <BreathingModal onClose={() => setBreathingOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
