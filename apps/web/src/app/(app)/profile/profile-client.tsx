'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { Profile, XpTransaction } from '@maable/core'
import type { ProfilePin } from './page'
import { updateProfile, savePin, deletePin, updateAvatarUrl } from './actions'
import { AvatarDisplay } from '@/components/app/avatar-builder'
import { ImageCropModal } from '@/components/app/image-crop-modal'

// ─── Level / class system ─────────────────────────────────────────────────────

function getPlayerClass(level: number): { title: string; color: string } {
  if (level < 5)  return { title: 'Novice',     color: 'rgba(26,25,22,0.45)' }
  if (level < 10) return { title: 'Apprentice', color: 'rgba(87,83,78,0.70)' }
  if (level < 15) return { title: 'Scholar',    color: 'rgba(120,113,108,0.80)' }
  if (level < 25) return { title: 'Sage',       color: '#a0845c' }
  if (level < 40) return { title: 'Expert',     color: '#b8973e' }
  if (level < 50) return { title: 'Master',     color: '#c9a84c' }
  return              { title: 'Legend',     color: '#e2c068' }
}

// ─── Achievements ─────────────────────────────────────────────────────────────

interface Achievement {
  id: string
  icon: string
  label: string
  desc: string
  check: (p: Profile, tasks: number, habits: number) => boolean
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task', icon: '◎', label: 'First Blood',       desc: 'Complete your first task',     check: (_, t) => t > 0 },
  { id: 'habit_7',   icon: '⊕', label: 'Creature of Habit', desc: '7 or more habit completions',  check: (_, _t, h) => h >= 7 },
  { id: 'level_5',   icon: '▲', label: 'Rising',             desc: 'Reach level 5',               check: p => p.level >= 5 },
  { id: 'level_10',  icon: '✦', label: 'Scholar',            desc: 'Reach level 10',              check: p => p.level >= 10 },
  { id: 'xp_1000',   icon: '◈', label: 'XP Hunter',          desc: 'Earn 1,000 total XP',         check: p => p.total_xp >= 1000 },
  { id: 'habit_20',  icon: '◆', label: 'Devoted',            desc: '20+ habit completions',       check: (_, _t, h) => h >= 20 },
  { id: 'level_25',  icon: '◇', label: 'Sage',               desc: 'Reach level 25',              check: p => p.level >= 25 },
  { id: 'xp_10k',    icon: '✧', label: 'Legendary',          desc: 'Earn 10,000 total XP',        check: p => p.total_xp >= 10000 },
]

// ─── XP source labels / icons ─────────────────────────────────────────────────

const XP_META: Record<string, { label: string; icon: string }> = {
  task_complete:      { label: 'Task completed',    icon: '◎' },
  habit_complete:     { label: 'Habit completed',   icon: '⊕' },
  streak_bonus:       { label: 'Streak bonus',      icon: '✦' },
  note_created:       { label: 'Note created',      icon: '·' },
  daily_login:        { label: 'Daily login',       icon: '◑' },
  challenge_complete: { label: 'Challenge',         icon: '▲' },
  level_up_bonus:     { label: 'Level up!',         icon: '◆' },
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Pin uploader ─────────────────────────────────────────────────────────────

function PinUploader({ userId, onUploaded }: { userId: string; onUploaded: (pin: ProfilePin) => void }) {
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB'); return }
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('pins').upload(path, file, { contentType: file.type })
      if (upErr) { console.error(upErr); return }
      const { data: { publicUrl } } = supabase.storage.from('pins').getPublicUrl(path)
      const result = await savePin(publicUrl, caption.trim() || null)
      if (!result.error) {
        onUploaded({ id: `pin-${Date.now()}`, image_url: publicUrl, caption: caption.trim() || null, sort_order: Math.floor(Date.now() / 1000), created_at: new Date().toISOString() })
        setCaption('')
      }
    } finally { setUploading(false) }
  }, [userId, caption, onUploaded])

  return (
    <div
      className="flex flex-col gap-2 p-4 cursor-pointer transition-all"
      style={{ border: '1px dashed rgba(26,25,22,0.20)', borderRadius: 6 }}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
    >
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {uploading ? (
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(26,25,22,0.40)', textAlign: 'center' }}>uploading…</p>
      ) : (
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(26,25,22,0.35)', textAlign: 'center' }}>
          drop image or click to add pin
        </p>
      )}
      <input type="text" value={caption} onChange={e => setCaption(e.target.value)} onClick={e => e.stopPropagation()}
        placeholder="caption (optional)" maxLength={80}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.70rem', color: 'rgba(26,25,22,0.55)', backgroundColor: 'transparent', outline: 'none', borderBottom: '1px solid rgba(26,25,22,0.12)', textAlign: 'center', padding: '2px 0' }} />
    </div>
  )
}

// ─── Pins mood board ──────────────────────────────────────────────────────────

function PinsGrid({ pins: initialPins, userId }: { pins: ProfilePin[]; userId: string }) {
  const [pins, setPins] = useState<ProfilePin[]>(initialPins)
  const [, startTransition] = useTransition()

  const handleUploaded = useCallback((pin: ProfilePin) => { setPins(prev => [...prev, pin]) }, [])
  const handleDelete = useCallback((id: string) => {
    setPins(prev => prev.filter(p => p.id !== id))
    startTransition(async () => { await deletePin(id) })
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: '0.60rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.30)', fontFamily: 'Georgia, serif' }}>
          mood board
        </span>
        <span style={{ fontSize: '0.60rem', color: 'rgba(26,25,22,0.25)', fontFamily: 'Georgia, serif' }}>{pins.length}/20</span>
      </div>
      {pins.length < 20 && <div className="mb-3"><PinUploader userId={userId} onUploaded={handleUploaded} /></div>}
      {pins.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {pins.map(pin => (
            <motion.div key={pin.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="relative group overflow-hidden aspect-square"
              style={{ borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(26,25,22,0.07)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pin.image_url} alt={pin.caption ?? ''} className="w-full h-full object-cover" />
              {pin.caption && (
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                  <p style={{ fontSize: '0.65rem', color: '#fff', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{pin.caption}</p>
                </div>
              )}
              <button onClick={() => handleDelete(pin.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                style={{ backgroundColor: 'rgba(0,0,0,0.50)' }}>×</button>
            </motion.div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.75rem', color: 'rgba(26,25,22,0.28)', textAlign: 'center', padding: '16px 0' }}>
          no pins yet
        </p>
      )}
    </div>
  )
}

// ─── ProfileClient ────────────────────────────────────────────────────────────

export function ProfileClient({
  profile, recentXp, tasksDoneCount, habitsDoneCount, pins,
}: {
  profile: Profile
  recentXp: XpTransaction[]
  tasksDoneCount: number
  habitsDoneCount: number
  pins: ProfilePin[]
}) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [avatarKey, setAvatarKey] = useState(0)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${profile.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true })
      if (upErr) return
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const urlWithBust = `${publicUrl}?t=${Date.now()}`
      const result = await updateAvatarUrl(urlWithBust)
      if (!result?.error) {
        setAvatarUrl(urlWithBust)
        setAvatarKey(k => k + 1)
        // Clear built avatar so photo shows
        localStorage.removeItem('maable-avatar-config')
        window.dispatchEvent(new CustomEvent('maable-avatar-update', { detail: null }))
      }
    } finally { setAvatarUploading(false) }
  }, [profile.id, supabase])

  const xpInLevel = profile.total_xp - (profile.level - 1) * 1000
  const xpProgress = (xpInLevel / 1000) * 100
  const xpToNext = 1000 - xpInLevel
  const playerClass = getPlayerClass(profile.level)

  const handleSave = () => {
    setSaveError(null)
    startTransition(async () => {
      const usernameChanged = username !== profile.username
      const result = await updateProfile({
        display_name: displayName,
        bio: bio || null,
        avatar_url: avatarUrl || null,
        ...(usernameChanged ? { username } : {}),
      })
      if (result.error) { setSaveError(result.error) }
      else { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500) }
    })
  }

  const handleCancel = () => {
    setEditing(false)
    setDisplayName(profile.display_name)
    setUsername(profile.username)
    setBio(profile.bio ?? '')
    setAvatarUrl(profile.avatar_url ?? '')
    setSaveError(null)
  }

  return (
    <>
      <AnimatePresence>
        {avatarCropSrc && (
          <ImageCropModal
            src={avatarCropSrc}
            aspect={1}
            onConfirm={(blob, _url) => {
              setAvatarCropSrc(null)
              void handleAvatarUpload(new File([blob], 'avatar.png', { type: 'image/png' }))
            }}
            onClose={() => setAvatarCropSrc(null)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-[calc(100dvh-4.5rem)]" style={{ backgroundColor: '#faf9f7' }}>

        {/* ── Character banner ──────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: '#0d0c0a',
            borderBottom: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          {/* Scanline */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)',
          }} />

          {/* Gold corner brackets */}
          {(['tl','tr','bl','br'] as const).map(c => (
            <div key={c} style={{
              position: 'absolute',
              width: 12, height: 12,
              top: c.startsWith('t') ? 8 : undefined,
              bottom: c.startsWith('b') ? 8 : undefined,
              left: c.endsWith('l') ? 8 : undefined,
              right: c.endsWith('r') ? 8 : undefined,
              borderTop: c.startsWith('t') ? '1.5px solid rgba(201,168,76,0.45)' : 'none',
              borderBottom: c.startsWith('b') ? '1.5px solid rgba(201,168,76,0.45)' : 'none',
              borderLeft: c.endsWith('l') ? '1.5px solid rgba(201,168,76,0.45)' : 'none',
              borderRight: c.endsWith('r') ? '1.5px solid rgba(201,168,76,0.45)' : 'none',
            }} />
          ))}

          <div className="relative max-w-5xl mx-auto px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-7" style={{ zIndex: 1 }}>
            {/* Avatar */}
            <div className="relative shrink-0 group">
              {/* Hidden file input — accepts any image at full original resolution */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setAvatarCropSrc(URL.createObjectURL(f))
                  e.target.value = ''
                }}
              />

              {/* Avatar frame */}
              <div
                style={{
                  width: 96, height: 96,
                  border: '2px solid rgba(201,168,76,0.40)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  backgroundColor: '#0a0908',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <AvatarDisplay key={avatarKey} avatarUrl={avatarUrl || profile.avatar_url} size={90} />

                {/* Hover overlay */}
                <button
                  onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.62)',
                    cursor: avatarUploading ? 'default' : 'pointer',
                    border: 'none',
                  }}
                >
                  {avatarUploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                      style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%' }}
                    />
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="13" r="4" stroke="rgba(255,255,255,0.85)" strokeWidth="2"/>
                      </svg>
                      <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.70)', fontFamily: 'Georgia, serif', fontStyle: 'italic', letterSpacing: '0.08em' }}>
                        upload
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Class badge */}
              <div
                className="absolute -bottom-2 -right-2 px-1.5 py-0.5"
                style={{
                  backgroundColor: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.30)',
                  borderRadius: 4,
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: '0.5rem', color: 'rgba(201,168,76,0.65)',
                  letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}
              >
                soon
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                {editing ? (
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="bg-transparent outline-none border-b"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.5rem', color: 'rgba(255,255,255,0.88)', borderColor: 'rgba(201,168,76,0.40)', minWidth: 0, maxWidth: 260 }} />
                ) : (
                  <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.5rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.2 }}>
                    {profile.display_name}
                  </h1>
                )}
                <span style={{
                  fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: playerClass.color,
                  border: `1px solid ${playerClass.color}44`,
                  padding: '2px 8px', borderRadius: 2,
                  fontFamily: 'Georgia, serif',
                }}>
                  {playerClass.title}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                {editing ? (
                  <div className="flex items-center gap-1">
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.30)' }}>@</span>
                    <input value={username} onChange={e => setUsername(e.target.value)} maxLength={30}
                      className="bg-transparent outline-none border-b"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.50)', borderColor: 'rgba(255,255,255,0.12)' }} />
                  </div>
                ) : (
                  <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.80rem', color: 'rgba(255,255,255,0.30)' }}>
                    @{profile.username}
                  </p>
                )}
                <span style={{ fontSize: '0.68rem', color: 'rgba(201,168,76,0.50)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  Lv.{profile.level}
                </span>
              </div>

              {/* Bio */}
              {editing ? (
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} maxLength={160}
                  className="bg-transparent outline-none border resize-none w-full mb-3"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.50)', borderColor: 'rgba(255,255,255,0.10)', borderRadius: 4, padding: '6px 8px' }}
                  placeholder="Write a short bio…" />
              ) : (
                profile.bio && (
                  <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', marginBottom: 12 }}>
                    {profile.bio}
                  </p>
                )
              )}

              {/* XP bar */}
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.45)', fontFamily: 'Georgia, serif', flexShrink: 0 }}>
                  exp
                </span>
                <div style={{ flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden', maxWidth: 240 }}>
                  <motion.div
                    style={{ height: '100%', backgroundColor: '#c9a84c', borderRadius: 1 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ delay: 0.2, duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
                <span style={{ fontSize: '0.68rem', color: 'rgba(201,168,76,0.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic', flexShrink: 0 }}>
                  {profile.total_xp.toLocaleString()} xp · {xpToNext} to next
                </span>
              </div>
            </div>

            {/* Edit controls */}
            <div className="flex flex-col gap-2 shrink-0">
              {saveError && (
                <p style={{ fontSize: '0.68rem', color: '#ff6b6b', fontFamily: 'Georgia, serif', fontStyle: 'italic', maxWidth: 160 }}>{saveError}</p>
              )}
              {editing ? (
                <>
                  <button onClick={handleSave}
                    className="px-4 py-2 text-xs transition-all"
                    style={{ backgroundColor: '#c9a84c', color: '#0a0908', fontFamily: 'Georgia, serif', fontStyle: 'italic', borderRadius: 4 }}>
                    save
                  </button>
                  <button onClick={handleCancel}
                    style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>
                    cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="px-4 py-2 text-xs transition-all"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)', color: saved ? '#c9a84c' : 'rgba(255,255,255,0.40)',
                    fontFamily: 'Georgia, serif', fontStyle: 'italic', borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                  {saved ? '✓ saved' : 'edit profile'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left column */}
            <div className="flex flex-col gap-6 lg:w-64 shrink-0">

              {/* Stat blocks */}
              <div>
                <p style={{ fontSize: '0.60rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.28)', fontFamily: 'Georgia, serif', marginBottom: 10 }}>
                  stats
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Level',     value: profile.level.toString(),             icon: '▲' },
                    { label: 'Total XP',  value: profile.total_xp.toLocaleString(),    icon: '✦' },
                    { label: 'Tasks',     value: tasksDoneCount.toString(),             icon: '◎' },
                    { label: 'Habits',    value: habitsDoneCount.toString(),            icon: '⊕' },
                  ].map(s => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                      className="flex flex-col gap-1 p-4"
                      style={{
                        backgroundColor: '#f0ede8',
                        border: '1px solid rgba(26,25,22,0.07)',
                        borderRadius: 6,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: '0.7rem', color: 'rgba(26,25,22,0.35)' }}>{s.icon}</span>
                        <span style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.35)', fontFamily: 'Georgia, serif' }}>{s.label}</span>
                      </div>
                      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.35rem', color: 'rgba(26,25,22,0.80)', lineHeight: 1 }}>
                        {s.value}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Mood board */}
              <div
                className="p-4"
                style={{ backgroundColor: '#f0ede8', border: '1px solid rgba(26,25,22,0.07)', borderRadius: 6 }}
              >
                <PinsGrid pins={pins} userId={profile.id} />
              </div>

              {/* Tier */}
              <div style={{ fontSize: '0.65rem', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(26,25,22,0.28)', textAlign: 'center' }}>
                {profile.subscription_tier} plan
              </div>
            </div>

            {/* Right column */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">

              {/* Achievements */}
              <div>
                <p style={{ fontSize: '0.60rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.28)', fontFamily: 'Georgia, serif', marginBottom: 10 }}>
                  achievements
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ACHIEVEMENTS.map((a, i) => {
                    const unlocked = a.check(profile, tasksDoneCount, habitsDoneCount)
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 340, damping: 26 }}
                        title={`${a.label}: ${a.desc}`}
                        className="flex flex-col items-center gap-2 p-4 transition-all"
                        style={{
                          backgroundColor: unlocked ? '#f0ede8' : 'rgba(26,25,22,0.02)',
                          border: `1px solid ${unlocked ? 'rgba(201,168,76,0.22)' : 'rgba(26,25,22,0.07)'}`,
                          borderRadius: 6,
                          opacity: unlocked ? 1 : 0.4,
                        }}
                      >
                        <div
                          style={{
                            width: 36, height: 36,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: unlocked ? 'rgba(201,168,76,0.10)' : 'rgba(26,25,22,0.04)',
                            borderRadius: 4,
                            fontSize: '1rem',
                            color: unlocked ? '#c9a84c' : 'rgba(26,25,22,0.30)',
                          }}
                        >
                          {unlocked ? a.icon : '◻'}
                        </div>
                        <p style={{
                          fontFamily: 'Georgia, serif', fontStyle: 'italic',
                          fontSize: '0.70rem', color: unlocked ? 'rgba(26,25,22,0.70)' : 'rgba(26,25,22,0.30)',
                          textAlign: 'center', lineHeight: 1.3,
                        }}>
                          {a.label}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* XP battle log */}
              {recentXp.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.14)' }} />
                    <span style={{ fontSize: '0.60rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.50)', fontFamily: 'Georgia, serif', flexShrink: 0 }}>
                      battle log
                    </span>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.14)' }} />
                  </div>

                  <div
                    className="rounded-md overflow-hidden"
                    style={{ border: '1px solid rgba(26,25,22,0.07)', backgroundColor: '#f8f6f2' }}
                  >
                    {recentXp.map((tx, i) => {
                      const meta = XP_META[tx.source] ?? { label: tx.source, icon: '·' }
                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, type: 'spring', stiffness: 340, damping: 26 }}
                          className="flex items-center gap-4 px-5 py-3"
                          style={{ borderBottom: i < recentXp.length - 1 ? '1px solid rgba(26,25,22,0.05)' : 'none' }}
                        >
                          <span style={{ fontSize: '0.8rem', color: 'rgba(26,25,22,0.30)', flexShrink: 0 }}>{meta.icon}</span>
                          <p style={{ flex: 1, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(26,25,22,0.65)' }}>
                            {meta.label}
                          </p>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(26,25,22,0.28)', fontFamily: 'Georgia, serif', flexShrink: 0 }}>
                            {formatRelative(tx.created_at)}
                          </span>
                          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.88rem', color: '#c9a84c', flexShrink: 0 }}>
                            +{tx.amount}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
