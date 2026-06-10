'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Profile } from '@maable/core'
import { SKINS, getSkin } from '@/lib/skins'
import type { SkinConfig } from '@/lib/skins'
import { updateTimezone, updateUsername, updateSkin, signOut } from './actions'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Section = 'account' | 'preferences' | 'appearance' | 'about'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
]

// ─── Field row ────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between py-5"
      style={{ borderBottom: '1px solid rgba(26,25,22,0.06)' }}
    >
      <div className="max-w-xs">
        <p
          className="text-sm text-stone-800"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="ml-10 flex-shrink-0">
        {children}
      </div>
    </div>
  )
}

// ─── Editable field ───────────────────────────────────────────────────────────

function EditableField({
  value: initialValue,
  onSave,
  placeholder,
  validate,
}: {
  value: string
  onSave: (val: string) => Promise<{ error: string | null }>
  placeholder?: string
  validate?: (val: string) => string | null
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [, startTransition] = useTransition()

  const handleSave = () => {
    if (validate) {
      const err = validate(value)
      if (err) { setError(err); return }
    }
    startTransition(async () => {
      const result = await onSave(value)
      if (result.error) {
        setError(result.error)
      } else {
        setEditing(false)
        setError(null)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <input
          autoFocus
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          placeholder={placeholder}
          className="text-sm text-stone-800 bg-transparent outline-none border-b border-stone-300 focus:border-stone-700 transition-colors pb-0.5 w-44 text-right"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="text-xs text-stone-800 hover:text-stone-900 transition-colors"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setValue(initialValue); setError(null) }}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-sm text-stone-500 hover:text-stone-800 transition-colors group flex items-center gap-2"
      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
    >
      {saved ? <span className="text-stone-400">Saved ✓</span> : value || <span className="text-stone-300">{placeholder}</span>}
      <span className="text-xs text-stone-300 group-hover:text-stone-500 transition-colors">edit</span>
    </button>
  )
}

// ─── Skin swatch ──────────────────────────────────────────────────────────────

function SkinSwatch({
  skin,
  selected,
  onSelect,
}: {
  skin: SkinConfig
  selected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        position: 'relative',
        width: 148,
        height: 104,
        backgroundColor: skin.vars['--paper'],
        border: selected
          ? `2px solid ${skin.vars['--ink']}`
          : `1px solid ${skin.vars['--ink-border']}`,
        padding: '14px 16px 12px',
        boxShadow: selected ? skin.vars['--shadow-hover'] : skin.vars['--shadow-card'],
        cursor: 'pointer',
        textAlign: 'left',
        flexShrink: 0,
      }}
    >
      {/* Mini page composition */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        {/* Heading line */}
        <div style={{ height: 3, width: '60%', backgroundColor: skin.vars['--ink'], opacity: 0.85 }} />
        {/* Body lines */}
        <div style={{ height: 2, width: '85%', backgroundColor: skin.vars['--ink-2'], opacity: 0.5 }} />
        <div style={{ height: 2, width: '70%', backgroundColor: skin.vars['--ink-2'], opacity: 0.35 }} />
        {/* Accent / tag pill */}
        <div style={{
          marginTop: 2,
          height: 6,
          width: 32,
          backgroundColor: skin.vars['--ink-3'],
          opacity: 0.4,
          borderRadius: 2,
        }} />
      </div>

      {/* Skin name */}
      <p style={{
        position: 'absolute',
        bottom: 10,
        left: 16,
        fontSize: 11,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        color: skin.vars['--ink'],
        opacity: 0.8,
        lineHeight: 1,
      }}>
        {skin.name}
      </p>

      {/* Selected dot */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: skin.vars['--ink'],
          }}
        />
      )}
    </motion.button>
  )
}

// ─── Dashboard layout picker ──────────────────────────────────────────────────

function DashboardLayoutPicker() {
  const [active, setActive] = useState<'1' | '2' | '3'>('1')

  useEffect(() => {
    const stored = localStorage.getItem('maable-dash-layout') as '1' | '2' | '3' | null
    if (stored) setActive(stored)
  }, [])

  const pick = (v: '1' | '2' | '3') => {
    setActive(v)
    localStorage.setItem('maable-dash-layout', v)
    window.dispatchEvent(new Event('maable-dash-layout-change'))
  }

  const layouts: Array<{
    id: '1' | '2' | '3'
    name: string
    desc: string
    preview: React.ReactNode
  }> = [
    {
      id: '1',
      name: 'Classic',
      desc: 'Character + stat cards. Physics playground below.',
      preview: (
        <div style={{ display: 'flex', gap: 6, height: 48 }}>
          <div style={{ width: 28, background: 'rgba(26,25,22,0.07)', borderRadius: 4 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 3, flex: 1 }}>
              {[0,1,2].map(i => <div key={i} style={{ flex: 1, background: 'rgba(26,25,22,0.08)', borderRadius: 3 }} />)}
            </div>
            <div style={{ display: 'flex', gap: 3, flex: 1 }}>
              {[0,1,2].map(i => <div key={i} style={{ flex: 1, background: 'rgba(26,25,22,0.06)', borderRadius: 3 }} />)}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: '2',
      name: 'Mission Desk',
      desc: 'Interactive task + habit view. Check off goals directly.',
      preview: (
        <div style={{ display: 'flex', gap: 6, height: 48 }}>
          <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: 6, width: '55%', background: 'rgba(26,25,22,0.10)', borderRadius: 3 }} />
            {[0,1,2].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid rgba(26,25,22,0.25)' }} />
                <div style={{ flex: 1, height: 3, background: 'rgba(26,25,22,0.07)', borderRadius: 3 }} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1, width: '60%', background: 'rgba(26,25,22,0.07)', borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid rgba(26,25,22,0.18)' }} />)}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: '3',
      name: 'Dark RPG',
      desc: 'Character sheet aesthetic. Quests, abilities, gold accents.',
      preview: (
        <div style={{ display: 'flex', gap: 6, height: 48, background: '#0a0908', borderRadius: 4, padding: '6px 8px' }}>
          <div style={{ flex: 0.9, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ flex: 1, background: 'rgba(201,168,76,0.12)', borderRadius: 3 }} />
            <div style={{ height: 2, background: 'rgba(201,168,76,0.30)', borderRadius: 2 }} />
            <div style={{ height: 4, background: 'rgba(201,168,76,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: 'rgba(201,168,76,0.50)', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: 3, background: 'rgba(201,168,76,0.22)', borderRadius: 2, width: '50%' }} />
            {[0,1,2].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 5, height: 5, border: '1px solid rgba(201,168,76,0.40)', borderRadius: 1 }} />
                <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <p className="text-xs text-stone-400 mb-3 mt-10" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        Dashboard layout
      </p>
      <div style={{ display: 'flex', gap: 14 }}>
        {layouts.map(({ id, name, desc, preview }) => (
          <motion.button
            key={id}
            onClick={() => pick(id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: 164, padding: '14px 16px 12px',
              background: '#faf9f7',
              border: active === id ? '2px solid #1a1916' : '1px solid rgba(26,25,22,0.12)',
              borderRadius: 6,
              cursor: 'pointer', textAlign: 'left', position: 'relative',
              boxShadow: active === id ? '0 4px 16px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'border 0.15s, box-shadow 0.15s',
            }}
          >
            <div style={{ marginBottom: 10 }}>{preview}</div>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.78rem', color: '#1a1916', margin: '0 0 2px' }}>
              {name}
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.62rem', color: 'rgba(26,25,22,0.40)', margin: 0, lineHeight: 1.4 }}>
              {desc}
            </p>
            {active === id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 7, height: 7, borderRadius: '50%', background: '#1a1916',
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Appearance section ────────────────────────────────────────────────────────

function AppearanceSection({ profile }: { profile: Profile }) {
  const [activeSkin, setActiveSkin] = useState(profile.current_skin_id ?? 'ink')
  const [, startTransition] = useTransition()

  const handleSelect = (slug: string) => {
    setActiveSkin(slug)

    // Apply immediately client-side so the whole app re-skins without a reload
    const skin = getSkin(slug)
    const root = document.documentElement
    for (const [key, value] of Object.entries(skin.vars)) {
      root.style.setProperty(key, value)
    }
    root.dataset.skin = slug

    startTransition(async () => { await updateSkin(slug) })
  }

  return (
    <motion.div
      key="appearance"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <p className="text-xs text-stone-300 tracking-widest uppercase mb-6">
        Appearance
      </p>

      {/* Description */}
      <p
        className="text-sm text-stone-400 mb-8 leading-relaxed"
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', maxWidth: 400 }}
      >
        Choose a skin. Each one changes the ink, paper, and shadows across the entire app.
      </p>

      {/* Skin grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {SKINS.map((skin) => (
          <SkinSwatch
            key={skin.slug}
            skin={skin}
            selected={activeSkin === skin.slug}
            onSelect={() => handleSelect(skin.slug)}
          />
        ))}
      </div>

      {/* Active skin description */}
      <AnimatePresence mode="wait">
        {SKINS.map((skin) =>
          skin.slug === activeSkin ? (
            <motion.p
              key={skin.slug}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-stone-400 mt-6"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {skin.description}
            </motion.p>
          ) : null
        )}
      </AnimatePresence>

      <DashboardLayoutPicker />
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsClient({ profile, email }: { profile: Profile; email: string }) {
  const [section, setSection] = useState<Section>('account')
  const [, startTransition] = useTransition()
  const [signingOut, setSigningOut] = useState(false)

  const SECTIONS: Array<{ id: Section; label: string }> = [
    { id: 'account', label: 'Account' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'about', label: 'About' },
  ]

  const handleSignOut = () => {
    setSigningOut(true)
    startTransition(async () => { await signOut() })
  }

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] bg-white overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 py-8 pl-10 pr-6"
        style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)' }}
      >
        <h1
          className="text-4xl text-stone-900 mb-8 leading-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Settings
        </h1>

        <nav className="flex flex-col gap-1.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="text-left px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: section === s.id ? '#1a1916' : 'transparent',
                color: section === s.id ? '#ffffff' : '#78716c',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-left px-3 py-2 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/category-lazy.png"
          alt=""
          className="w-28 opacity-20 object-contain self-center mt-4"
          draggable={false}
        />
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-12 py-8" style={{ scrollbarWidth: 'none' }}>
        <style>{`main::-webkit-scrollbar { display: none; }`}</style>

        <AnimatePresence mode="wait">
          {section === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <p
                className="text-xs text-stone-300 tracking-widest uppercase mb-6"
              >
                Account
              </p>

              <FieldRow label="Email" description="Your sign-in address — cannot be changed here.">
                <span
                  className="text-sm text-stone-400"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  {email}
                </span>
              </FieldRow>

              <FieldRow
                label="Username"
                description="Shown on the leaderboard. Lowercase, numbers, underscores. 3–20 chars."
              >
                <EditableField
                  value={profile.username}
                  placeholder="username"
                  validate={(v) => {
                    if (!v.trim()) return 'Required'
                    if (!/^[a-z0-9_]{3,20}$/.test(v)) return '3–20 chars: a-z, 0-9, _'
                    return null
                  }}
                  onSave={(val) => updateUsername(val)}
                />
              </FieldRow>

              <FieldRow label="Subscription" description="Your current plan.">
                <span
                  className="text-sm text-stone-500 capitalize px-2 py-0.5"
                  style={{
                    backgroundColor: 'rgba(26,25,22,0.05)',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                  }}
                >
                  {profile.subscription_tier}
                </span>
              </FieldRow>

              <FieldRow label="Level" description="Your current XP level.">
                <span
                  className="text-sm text-stone-600"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Lv.{profile.level} · {profile.total_xp.toLocaleString()} xp
                </span>
              </FieldRow>

              <FieldRow label="Member since" description="">
                <span
                  className="text-sm text-stone-400"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </FieldRow>
            </motion.div>
          )}

          {section === 'preferences' && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <p className="text-xs text-stone-300 tracking-widest uppercase mb-6">
                Preferences
              </p>

              <FieldRow
                label="Timezone"
                description="Used to calculate streaks and schedule your day correctly."
              >
                <select
                  defaultValue={profile.timezone}
                  onChange={(e) => {
                    startTransition(async () => { await updateTimezone(e.target.value) })
                  }}
                  className="text-sm text-stone-600 bg-white outline-none cursor-pointer"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    border: '1px solid rgba(26,25,22,0.12)',
                    padding: '4px 8px',
                  }}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow
                label="Schedule algorithm"
                description="Automatically plans your day based on task priority, due dates, and habits to reduce decision fatigue."
              >
                <span
                  className="text-xs text-stone-300 px-2 py-0.5"
                  style={{ border: '1px solid rgba(26,25,22,0.10)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Coming soon
                </span>
              </FieldRow>

              <FieldRow
                label="Revision Mode"
                description="Turn your notes into flashcards and study with spaced repetition. Ask Chibi to revise for any subject."
              >
                <span
                  className="text-xs px-2 py-0.5"
                  style={{ border: '1px solid rgba(26,25,22,0.20)', color: '#78716c', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Active
                </span>
              </FieldRow>

              <FieldRow
                label="Chibi AI"
                description="Your on-device companion. Navigates pages, opens notes, quizzes you, and keeps you on track."
              >
                <span
                  className="text-xs px-2 py-0.5"
                  style={{ border: '1px solid rgba(26,25,22,0.20)', color: '#78716c', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Active
                </span>
              </FieldRow>
            </motion.div>
          )}

          {section === 'appearance' && (
            <AppearanceSection profile={profile} />
          )}

          {section === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <p className="text-xs text-stone-300 tracking-widest uppercase mb-6">
                About
              </p>

              <FieldRow label="Version" description="">
                <span className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  0.1.0 · Early Access
                </span>
              </FieldRow>

              <FieldRow label="Built with" description="">
                <span className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  Next.js · Supabase · Framer Motion
                </span>
              </FieldRow>

              {/* Manifesto */}
              <div className="mt-10 max-w-md">
                <p
                  className="text-xs text-stone-300 tracking-widest uppercase mb-4"
                >
                  Manifesto
                </p>
                <div
                  className="space-y-3 text-sm text-stone-500 leading-7"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  <p>Maable is built on a simple belief — that becoming more productive should feel like levelling up, not burning out.</p>
                  <p>We designed every pixel to feel like ink on paper. Every interaction to feel like turning a page.</p>
                  <p>The algorithm plans your day so you don't have to. The streak keeps you honest. The chibi keeps you company.</p>
                  <p>Do the work. Earn the XP. That's it.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
