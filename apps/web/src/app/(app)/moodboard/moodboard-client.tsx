'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { savePin, deletePin } from '@/app/(app)/profile/actions'
import { ImageCropModal } from '@/components/app/image-crop-modal'
import type { MoodPin, MoodTask, MoodHabit, MoodStats } from './page'
import type { Profile } from '@maable/core'

// ─── Deterministic tilt (stable per item id) ─────────────────────────────────

function tilt(seed: string, range = 3.5) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return ((h % 1000) / 1000 - 0.5) * range * 2
}

// ─── Priority palette ─────────────────────────────────────────────────────────

const P_BG: Record<string, string>     = { urgent: '#fff0ee', high: '#fff8ee', medium: '#eef4ff', low: '#eefff4' }
const P_ACCENT: Record<string, string> = { urgent: '#e74c3c', high: '#e67e22', medium: '#3b82f6', low: '#22c55e' }
const P_LABEL: Record<string, string>  = { urgent: 'urgent', high: 'high', medium: 'medium', low: 'low' }

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ label, value, sub, color = '#1a1916' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '10px 18px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
        minWidth: 80, flexShrink: 0,
        gap: 1,
      }}
    >
      <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'rgba(26,25,22,0.38)', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color, lineHeight: 1.1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: '0.55rem', color: 'rgba(26,25,22,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{sub}</span>}
    </motion.div>
  )
}

// ─── Image pin card ───────────────────────────────────────────────────────────

function ImagePinCard({ pin, onDelete }: { pin: MoodPin; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)
  const [, startTransition] = useTransition()
  const deg = tilt(pin.id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 12px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)'
          : '0 4px 16px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)',
        rotate: deg,
        cursor: 'default',
        breakInside: 'avoid',
        marginBottom: 16,
        display: 'block',
        background: '#fff',
        transition: 'box-shadow 0.2s',
      }}
    >
      <img
        src={pin.image_url}
        alt={pin.caption ?? ''}
        style={{ display: 'block', width: '100%', objectFit: 'cover' }}
        draggable={false}
      />
      {pin.caption && (
        <div style={{ padding: '8px 12px 10px' }}>
          <p style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '0.7rem', color: 'rgba(26,25,22,0.55)',
            margin: 0, lineHeight: 1.35,
          }}>
            {pin.caption}
          </p>
        </div>
      )}

      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => {
              onDelete(pin.id)
              startTransition(async () => { await deletePin(pin.id) })
            }}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(10,9,8,0.65)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Text pin card ────────────────────────────────────────────────────────────

const TEXT_PIN_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  paper: { bg: '#faf5e4',   text: '#2a2722',            border: 'rgba(26,25,22,0.10)' },
  dark:  { bg: '#1a1916',   text: 'rgba(255,255,255,0.82)', border: 'rgba(255,255,255,0.08)' },
  blush: { bg: '#f7ece9',   text: '#2a2722',            border: 'rgba(180,80,60,0.10)' },
  sage:  { bg: '#e9f0eb',   text: '#1e2e22',            border: 'rgba(60,110,70,0.10)' },
}

function TextPinCard({ pin, onDelete }: { pin: MoodPin; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)
  const [, startTransition] = useTransition()
  const deg = tilt(pin.id)
  const styleName = pin.image_url.split(':')[2] ?? 'paper'
  const theme = TEXT_PIN_STYLES[styleName] ?? TEXT_PIN_STYLES.paper!
  const text = pin.caption ?? ''
  const fontSize = text.length > 60 ? '0.88rem' : text.length > 30 ? '1.05rem' : '1.28rem'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: 'relative',
        background: theme.bg,
        borderRadius: 14,
        border: `1px solid ${theme.border}`,
        padding: '22px 18px 24px',
        boxShadow: hovered
          ? '0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.07)'
          : '0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        rotate: deg,
        breakInside: 'avoid',
        marginBottom: 16,
        cursor: 'default',
        transition: 'box-shadow 0.2s',
      }}
    >
      <p style={{
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize, lineHeight: 1.45,
        color: theme.text,
        margin: 0, textAlign: 'center',
        userSelect: 'none',
      }}>
        {text}
      </p>

      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => {
              onDelete(pin.id)
              startTransition(async () => { await deletePin(pin.id) })
            }}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(10,9,8,0.60)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: MoodTask }) {
  const deg = tilt(task.id + 't', 2)
  const bg = P_BG[task.priority] ?? '#fffef8'
  const accent = P_ACCENT[task.priority] ?? '#aaa'

  return (
    <Link href="/tasks" style={{ textDecoration: 'none', display: 'block', breakInside: 'avoid', marginBottom: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
        style={{
          background: bg,
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
          borderLeft: `3.5px solid ${accent}`,
          rotate: deg,
          cursor: 'pointer',
        }}
      >
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: '#1a1916', margin: 0, lineHeight: 1.4 }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, fontWeight: 700 }}>
            {P_LABEL[task.priority] ?? task.priority}
          </span>
          {task.due_date && (
            <span style={{ fontSize: '0.58rem', color: 'rgba(26,25,22,0.35)', fontFamily: 'Georgia, serif' }}>
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

// ─── Habit card ───────────────────────────────────────────────────────────────

function HabitCard({ habit }: { habit: MoodHabit }) {
  const deg = tilt(habit.id + 'h', 2)
  const CIRC = 2 * Math.PI * 14
  const progress = Math.min(habit.current_streak / 30, 1)

  return (
    <Link href="/habits" style={{ textDecoration: 'none', display: 'block', breakInside: 'avoid', marginBottom: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
          rotate: deg,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        {/* Streak ring */}
        <svg width={36} height={36} style={{ flexShrink: 0, rotate: '-90deg' }}>
          <circle cx={18} cy={18} r={14} fill="none" stroke="rgba(26,25,22,0.07)" strokeWidth={2.5}/>
          <circle cx={18} cy={18} r={14} fill="none"
            stroke={habit.current_streak > 0 ? '#f97316' : 'rgba(26,25,22,0.12)'}
            strokeWidth={2.5} strokeLinecap="round"
            strokeDasharray={`${CIRC}`}
            strokeDashoffset={CIRC - CIRC * progress}
          />
        </svg>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', color: '#1a1916', margin: 0, lineHeight: 1.35, wordBreak: 'break-word' }}>
            {habit.title}
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.6rem', color: habit.current_streak > 0 ? '#f97316' : 'rgba(26,25,22,0.3)', margin: '3px 0 0', fontStyle: 'italic' }}>
            {habit.current_streak > 0 ? `${habit.current_streak} day streak streak` : 'start your streak'}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}

// ─── Quick add pin cards ──────────────────────────────────────────────────────

function QuickAddImageCard({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'block', width: '100%', breakInside: 'avoid', marginBottom: 16,
        background: 'rgba(255,255,255,0.55)',
        border: '1.5px dashed rgba(26,25,22,0.14)',
        borderRadius: 14, padding: '26px 16px',
        cursor: 'pointer', textAlign: 'center',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 6px', opacity: 0.35, display: 'block' }}>
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1a1916" strokeWidth="1.5"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="#1a1916"/>
        <path d="M21 15l-5-5L5 21" stroke="#1a1916" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.70rem', color: 'rgba(26,25,22,0.38)', margin: 0 }}>
        photo
      </p>
    </motion.button>
  )
}

function QuickAddTextCard({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'block', width: '100%', breakInside: 'avoid', marginBottom: 16,
        background: 'rgba(255,255,255,0.55)',
        border: '1.5px dashed rgba(26,25,22,0.14)',
        borderRadius: 14, padding: '26px 16px',
        cursor: 'pointer', textAlign: 'center',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 6px', opacity: 0.35, display: 'block' }}>
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#1a1916" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.70rem', color: 'rgba(26,25,22,0.38)', margin: 0 }}>
        word clip
      </p>
    </motion.button>
  )
}

// ─── Add pin modal (photo + text tabs) ───────────────────────────────────────

const TEXT_STYLE_OPTS = [
  { key: 'paper', label: 'paper', bg: '#faf5e4', text: '#2a2722' },
  { key: 'dark',  label: 'dark',  bg: '#1a1916', text: 'rgba(255,255,255,0.82)' },
  { key: 'blush', label: 'blush', bg: '#f7ece9', text: '#2a2722' },
  { key: 'sage',  label: 'sage',  bg: '#e9f0eb', text: '#1e2e22' },
] as const

type TextStyleKey = typeof TEXT_STYLE_OPTS[number]['key']

function AddPinModal({ userId, initialMode = 'photo', onUploaded, onClose }: {
  userId: string
  initialMode?: 'photo' | 'text'
  onUploaded: (pin: MoodPin) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'photo' | 'text'>(initialMode)

  // Photo state
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Text state
  const [textContent, setTextContent] = useState('')
  const [textStyle, setTextStyle] = useState<TextStyleKey>('paper')

  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return
    setCropSrc(URL.createObjectURL(f))
  }, [])

  const handleCropConfirm = useCallback((blob: Blob, url: string) => {
    setFile(new File([blob], 'pin.png', { type: 'image/png' }))
    setPreview(url)
    setCropSrc(null)
  }, [])

  const handlePhotoUpload = useCallback(async () => {
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('pins').upload(path, file, { contentType: file.type })
      if (upErr) return
      const { data: { publicUrl } } = supabase.storage.from('pins').getPublicUrl(path)
      const result = await savePin(publicUrl, caption.trim() || null)
      if (!result?.error) {
        onUploaded({ id: `pin-${Date.now()}`, image_url: publicUrl, caption: caption.trim() || null, sort_order: Math.floor(Date.now() / 1000), created_at: new Date().toISOString() })
        onClose()
      }
    } finally { setUploading(false) }
  }, [file, userId, caption, supabase, onUploaded, onClose])

  const handleTextPin = useCallback(async () => {
    const text = textContent.trim()
    if (!text) return
    setUploading(true)
    try {
      const result = await savePin(`pin:text:${textStyle}`, text)
      if (!result?.error) {
        onUploaded({ id: `pin-${Date.now()}`, image_url: `pin:text:${textStyle}`, caption: text, sort_order: Math.floor(Date.now() / 1000), created_at: new Date().toISOString() })
        onClose()
      }
    } finally { setUploading(false) }
  }, [textContent, textStyle, onUploaded, onClose])

  if (cropSrc) {
    return <ImageCropModal src={cropSrc} onConfirm={handleCropConfirm} onClose={() => setCropSrc(null)} />
  }

  const selectedTheme = TEXT_STYLE_OPTS.find(s => s.key === textStyle) ?? TEXT_STYLE_OPTS[0]!

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,9,8,0.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        style={{
          background: '#faf8f3', borderRadius: 20,
          padding: '24px 28px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        }}
      >
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'rgba(26,25,22,0.06)', borderRadius: 10, padding: 3 }}>
          {(['photo', 'text'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '7px 0',
                borderRadius: 8, border: 'none',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '0.78rem',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#1a1916' : 'rgba(26,25,22,0.40)',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {m === 'photo' ? 'Photo' : 'Word clip'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === 'photo' ? (
            <motion.div key="photo" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}>
              {!preview ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                  onClick={() => inputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? '#1a1916' : 'rgba(26,25,22,0.15)'}`,
                    borderRadius: 12, padding: '40px 16px',
                    textAlign: 'center', cursor: 'pointer',
                    background: dragOver ? 'rgba(26,25,22,0.03)' : 'transparent',
                    transition: 'all 0.15s', marginBottom: 14,
                  }}
                >
                  <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 10px', opacity: 0.28, display: 'block' }}>
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1a1916" strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#1a1916"/>
                    <path d="M21 15l-5-5L5 21" stroke="#1a1916" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(26,25,22,0.42)', margin: 0 }}>
                    drop image or click to browse
                  </p>
                </div>
              ) : (
                <div style={{ position: 'relative', marginBottom: 14, borderRadius: 12, overflow: 'hidden', background: '#e8e4dc' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'contain' }} />
                  <button onClick={() => { setFile(null); setPreview(null) }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(10,9,8,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )}

              <input
                value={caption} onChange={(e) => setCaption(e.target.value)}
                placeholder="add a caption (optional)"
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid rgba(26,25,22,0.12)',
                  borderRadius: 10, fontSize: '0.8rem', fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  background: 'transparent', color: '#1a1916', outline: 'none', boxSizing: 'border-box', marginBottom: 12,
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid rgba(26,25,22,0.12)', borderRadius: 10, fontSize: '0.78rem', fontFamily: 'Georgia, serif', color: 'rgba(26,25,22,0.45)', background: 'transparent', cursor: 'pointer' }}>
                  cancel
                </button>
                <button onClick={handlePhotoUpload} disabled={!file || uploading}
                  style={{ flex: 2, padding: '10px', borderRadius: 10, fontSize: '0.78rem', fontFamily: 'Georgia, serif', background: !file || uploading ? 'rgba(26,25,22,0.1)' : '#1a1916', color: !file || uploading ? 'rgba(26,25,22,0.35)' : '#f5f0e8', border: 'none', cursor: !file || uploading ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                  {uploading ? 'uploading…' : 'pin it'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="text" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              {/* Live preview */}
              <div style={{
                background: selectedTheme.bg, borderRadius: 12,
                padding: '20px 16px 22px', marginBottom: 14, minHeight: 90,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(26,25,22,0.06)',
              }}>
                <p style={{
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: textContent.length > 60 ? '0.88rem' : textContent.length > 30 ? '1.05rem' : '1.25rem',
                  color: selectedTheme.text,
                  margin: 0, textAlign: 'center', lineHeight: 1.45,
                  transition: 'font-size 0.15s',
                }}>
                  {textContent || <span style={{ opacity: 0.35 }}>your words here…</span>}
                </p>
              </div>

              {/* Text input */}
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                maxLength={120}
                rows={3}
                placeholder="write something…"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid rgba(26,25,22,0.12)', borderRadius: 10,
                  fontSize: '0.82rem', fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  background: 'transparent', color: '#1a1916', outline: 'none',
                  boxSizing: 'border-box', marginBottom: 10, resize: 'none',
                  lineHeight: 1.5,
                }}
              />

              {/* Style picker */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {TEXT_STYLE_OPTS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setTextStyle(opt.key)}
                    style={{
                      flex: 1, height: 30, borderRadius: 8,
                      background: opt.bg, cursor: 'pointer',
                      border: textStyle === opt.key ? '2px solid #1a1916' : '1.5px solid rgba(26,25,22,0.12)',
                      transition: 'border-color 0.12s',
                    }}
                    title={opt.label}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid rgba(26,25,22,0.12)', borderRadius: 10, fontSize: '0.78rem', fontFamily: 'Georgia, serif', color: 'rgba(26,25,22,0.45)', background: 'transparent', cursor: 'pointer' }}>
                  cancel
                </button>
                <button onClick={handleTextPin} disabled={!textContent.trim() || uploading}
                  style={{ flex: 2, padding: '10px', borderRadius: 10, fontSize: '0.78rem', fontFamily: 'Georgia, serif', background: !textContent.trim() || uploading ? 'rgba(26,25,22,0.1)' : '#1a1916', color: !textContent.trim() || uploading ? 'rgba(26,25,22,0.35)' : '#f5f0e8', border: 'none', cursor: !textContent.trim() || uploading ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                  {uploading ? 'saving…' : 'pin it'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  userId: string
  profile: Profile | null
  pins: MoodPin[]
  tasks: MoodTask[]
  habits: MoodHabit[]
  stats: MoodStats
}

export function MoodBoardClient({ userId, profile, pins: initialPins, tasks, habits, stats }: Props) {
  const [pins, setPins] = useState<MoodPin[]>(initialPins)
  const [addMode, setAddMode] = useState<'photo' | 'text' | null>(null)

  const handleUploaded = useCallback((pin: MoodPin) => {
    setPins(prev => [pin, ...prev])
  }, [])

  const handleDelete = useCallback((id: string) => {
    setPins(prev => prev.filter(p => p.id !== id))
  }, [])

  // Build masonry items — interleave pins, tasks, habits
  const allItems: Array<
    | { kind: 'pin'; data: MoodPin }
    | { kind: 'task'; data: MoodTask }
    | { kind: 'habit'; data: MoodHabit }
    | { kind: 'add-image' }
    | { kind: 'add-text' }
  > = []

  allItems.push({ kind: 'add-image' })
  allItems.push({ kind: 'add-text' })

  const maxLen = Math.max(pins.length, tasks.length, habits.length)
  let pi = 0, ti = 0, hi = 0
  for (let _i = 0; _i < maxLen; _i++) {
    const pin = pins[pi]; if (pin) { allItems.push({ kind: 'pin', data: pin }); pi++ }
    const task = tasks[ti]; if (task) { allItems.push({ kind: 'task', data: task }); ti++ }
    const habit = habits[hi]; if (habit) { allItems.push({ kind: 'habit', data: habit }); hi++ }
  }

  const xpProgress = (stats.levelXp / 1000) * 100

  return (
    <div style={{ minHeight: '100dvh', background: '#f0ebe2' }}>
      {/* Subtle paper grain */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* ── Top bar ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.45rem', color: '#1a1916', margin: 0, lineHeight: 1.1 }}>
              {profile?.display_name ? `${profile.display_name}'s board` : 'my board'}
            </h1>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.68rem', color: 'rgba(26,25,22,0.4)', margin: '3px 0 0' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <Link
            href="/dashboard"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: 'rgba(26,25,22,0.07)',
              border: '1px solid rgba(26,25,22,0.10)',
              borderRadius: 20,
              textDecoration: 'none',
              fontSize: '0.72rem',
              fontFamily: 'Georgia, serif',
              color: 'rgba(26,25,22,0.55)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            dashboard
          </Link>
        </div>

        {/* ── Stat chips ──────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 28, paddingBottom: 4, scrollbarWidth: 'none' }}>
          <StatChip label="level" value={`${stats.level}`} sub="lv" />
          <StatChip label="total xp" value={stats.totalXp.toLocaleString()} sub="xp" />

          {/* XP progress bar chip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex', flexDirection: 'column', gap: 4,
              boxShadow: '0 2px 10px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
              minWidth: 130, flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'rgba(26,25,22,0.38)' }}>
              next level
            </span>
            <div style={{ height: 4, background: 'rgba(26,25,22,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: '#1a1916', borderRadius: 4 }}
              />
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.62rem', color: 'rgba(26,25,22,0.38)' }}>
              {stats.levelXp}/1000 xp
            </span>
          </motion.div>

          <StatChip label="streak" value={stats.streakDays > 0 ? `${stats.streakDays}streak` : '—'} sub="days" />
          <StatChip label="this week" value={`${stats.tasksCompleted}`} sub="tasks done" />
          {stats.weeklyScore > 0 && <StatChip label="score" value={`+${stats.weeklyScore}`} sub="xp earned" color="#d97706" />}
        </div>

        {/* ── Masonry board ────────────────────────────────────── */}
        <div
          style={{
            columnCount: 3,
            columnGap: 16,
          }}
          className="moodboard-columns"
        >
          <AnimatePresence>
            {allItems.map((item, idx) => {
              if (item.kind === 'add-image') {
                return <QuickAddImageCard key="add-image" onOpen={() => setAddMode('photo')} />
              }
              if (item.kind === 'add-text') {
                return <QuickAddTextCard key="add-text" onOpen={() => setAddMode('text')} />
              }
              if (item.kind === 'pin') {
                const isText = item.data.image_url.startsWith('pin:text')
                return isText
                  ? <TextPinCard key={item.data.id} pin={item.data} onDelete={handleDelete} />
                  : <ImagePinCard key={item.data.id} pin={item.data} onDelete={handleDelete} />
              }
              if (item.kind === 'task') {
                return <TaskCard key={item.data.id} task={item.data} />
              }
              if (item.kind === 'habit') {
                return <HabitCard key={`${item.data.id}-${idx}`} habit={item.data} />
              }
              return null
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {pins.length === 0 && tasks.length === 0 && habits.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ textAlign: 'center', paddingTop: 60 }}
          >
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(26,25,22,0.3)' }}>
              your board is waiting — add tasks, habits, or a pin
            </p>
          </motion.div>
        )}
      </div>

      {/* Add pin modal */}
      <AnimatePresence>
        {addMode && (
          <AddPinModal
            userId={userId}
            initialMode={addMode}
            onUploaded={handleUploaded}
            onClose={() => setAddMode(null)}
          />
        )}
      </AnimatePresence>

      {/* Responsive columns */}
      <style>{`
        .moodboard-columns { column-count: 3; }
        @media (max-width: 768px) { .moodboard-columns { column-count: 2; } }
        @media (max-width: 480px) { .moodboard-columns { column-count: 1; } }
      `}</style>
    </div>
  )
}
