'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { JournalEntry } from '@maable/core'
import { upsertJournalEntry, deleteJournalEntry } from './actions'

// ─── Prompts ──────────────────────────────────────────────────────────────────

const PROMPTS = [
  "What made you smile today?",
  "What are you grateful for right now?",
  "What would make today feel complete?",
  "Describe your energy in one sentence.",
  "What's one thing you want to let go of?",
  "What did you learn today?",
  "What are you looking forward to tomorrow?",
  "How did you take care of yourself today?",
  "What felt hard today — and why?",
  "What's on your mind that you haven't said aloud?",
  "What's a small win worth remembering?",
  "Who made a difference in your day?",
  "What do you wish you'd done differently?",
  "Describe your day in three words.",
  "What conversation do you keep replaying?",
]

function dailyPrompt(dateStr: string): string {
  const seed = dateStr.split('-').reduce((a, n) => a + parseInt(n), 0)
  return PROMPTS[seed % PROMPTS.length]!
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseLocalDate(str: string): Date {
  const [y, m, day] = str.split('-').map(Number)
  return new Date(y!, m! - 1, day!)
}

function formatDisplayDate(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function computeStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0
  const today = toDateStr(new Date())
  const dates = new Set(entries.map(e => e.entry_date))
  let streak = 0
  let cursor = new Date()
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1)
  while (dates.has(toDateStr(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG_DEEP    = '#0f0e0c'
const BG_CARD    = '#1a1916'
const BG_CARD2   = '#211f1b'
const BORDER     = 'rgba(255,255,255,0.07)'
const GOLD       = '#c9a84c'
const GOLD_DIM   = 'rgba(201,168,76,0.45)'
const TEXT_HI    = 'rgba(255,255,255,0.82)'
const TEXT_MID   = 'rgba(255,255,255,0.48)'
const TEXT_LO    = 'rgba(255,255,255,0.28)'
const SERIF      = { fontFamily: 'Georgia, serif', fontStyle: 'italic' } as const

// Dot-grid background style (architecture feel)
const DOT_GRID = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
} as const

// ─── Mood picker ──────────────────────────────────────────────────────────────

const MOODS = [
  { val: 1, label: 'rough', color: 'rgba(255,255,255,0.20)' },
  { val: 2, label: 'low',   color: 'rgba(255,255,255,0.38)' },
  { val: 3, label: 'okay',  color: 'rgba(255,255,255,0.58)' },
  { val: 4, label: 'good',  color: 'rgba(255,255,255,0.78)' },
  { val: 5, label: 'great', color: GOLD },
]

function MoodPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ ...SERIF, fontSize: '0.72rem', color: TEXT_LO }}>mood</span>
      <div className="flex gap-2">
        {MOODS.map(m => (
          <button key={m.val} onClick={() => onChange(m.val)} title={m.label} className="flex flex-col items-center gap-1">
            <div style={{
              width: 11, height: 11, borderRadius: '50%',
              backgroundColor: value !== null && value >= m.val ? m.color : 'transparent',
              border: `1.5px solid ${m.color}`,
              transition: 'all 0.18s ease',
              transform: value === m.val ? 'scale(1.5)' : 'scale(1)',
            }} />
            {value === m.val && (
              <span style={{ ...SERIF, fontSize: '0.58rem', color: TEXT_LO }}>{m.label}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Mini calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  selectedDate, entryDates, onSelect,
}: {
  selectedDate: string
  entryDates: Set<string>
  onSelect: (d: string) => void
}) {
  const today = toDateStr(new Date())
  const sel = parseLocalDate(selectedDate)
  const [viewYear, setViewYear]   = useState(sel.getFullYear())
  const [viewMonth, setViewMonth] = useState(sel.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth)
  const monthName   = new Date(viewYear, viewMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay === 0 ? 6 : firstDay - 1).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} style={{ color: TEXT_LO, fontSize: '0.8rem', padding: '2px 5px' }}>‹</button>
        <span style={{ ...SERIF, fontSize: '0.72rem', color: TEXT_MID }}>{monthName}</span>
        <button
          onClick={nextMonth}
          style={{ color: TEXT_LO, fontSize: '0.8rem', padding: '2px 5px' }}
          disabled={viewYear === new Date().getFullYear() && viewMonth >= new Date().getMonth()}
        >›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{ fontSize: '0.58rem', color: TEXT_LO, textAlign: 'center', fontFamily: 'Georgia, serif' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr  = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday  = dateStr === today
          const isSel    = dateStr === selectedDate
          const hasEntry = entryDates.has(dateStr)
          const isFuture = dateStr > today

          return (
            <button
              key={i}
              onClick={() => !isFuture && onSelect(dateStr)}
              disabled={isFuture}
              className="flex flex-col items-center justify-center relative"
              style={{
                height: 26,
                backgroundColor: isSel ? GOLD : 'transparent',
                border: isToday && !isSel ? `1px solid ${GOLD_DIM}` : '1px solid transparent',
                opacity: isFuture ? 0.18 : 1,
                cursor: isFuture ? 'default' : 'pointer',
                borderRadius: 2,
              }}
            >
              <span style={{
                fontSize: '0.65rem',
                ...SERIF,
                color: isSel ? '#0f0e0c' : isToday ? GOLD : TEXT_MID,
                fontWeight: isSel || isToday ? 700 : 400,
              }}>
                {day}
              </span>
              {hasEntry && !isSel && (
                <div style={{
                  width: 3, height: 3, borderRadius: '50%',
                  backgroundColor: GOLD,
                  position: 'absolute', bottom: 2,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── JournalClient ────────────────────────────────────────────────────────────

export function JournalClient({ entries }: { entries: JournalEntry[] }) {
  const today = toDateStr(new Date())
  const [selectedDate, setSelectedDate]         = useState(today)
  const [saving, setSaving]                     = useState(false)
  const [savedAt, setSavedAt]                   = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const entryMap  = new Map(entries.map(e => [e.entry_date, e]))
  const entryDates = new Set(entries.map(e => e.entry_date))

  const current = entryMap.get(selectedDate)
  const prompt  = dailyPrompt(selectedDate)

  const [content, setContent] = useState(current?.content ?? '')
  const [mood, setMood]       = useState<number | null>(current?.mood ?? null)

  useEffect(() => {
    const e = entryMap.get(selectedDate)
    setContent(e?.content ?? '')
    setMood(e?.mood ?? null)
    setSavedAt(null)
    setShowDeleteConfirm(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const save = useCallback(async (text: string, m: number | null) => {
    if (!text.trim() && m === null) return
    setSaving(true)
    await upsertJournalEntry({ entry_date: selectedDate, content: text, mood: m, prompt })
    setSaving(false)
    setSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
  }, [selectedDate, prompt])

  const handleContentChange = (val: string) => {
    setContent(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(val, mood), 1400)
  }

  const handleMoodChange = (val: number) => {
    const newMood = mood === val ? null : val
    setMood(newMood)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(content, newMood), 400)
  }

  const handleDelete = async () => {
    await deleteJournalEntry(selectedDate)
    setContent(''); setMood(null); setSavedAt(null); setShowDeleteConfirm(false)
  }

  const streak       = computeStreak(entries)
  const totalEntries = entries.length
  const isToday      = selectedDate === today
  const wordCount    = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: BG_DEEP, ...DOT_GRID, fontFamily: 'Georgia, serif' }}>
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          {/* Gold top rule */}
          <div style={{ height: 1, backgroundColor: GOLD_DIM, marginBottom: 16 }} />
          <div className="flex items-end justify-between">
            <div>
              <p style={{ ...SERIF, fontSize: '0.65rem', letterSpacing: '0.30em', textTransform: 'uppercase', color: GOLD_DIM, marginBottom: 4 }}>
                private journal
              </p>
              <h1 style={{ ...SERIF, fontSize: '1.8rem', color: GOLD, lineHeight: 1 }}>
                Journal
              </h1>
            </div>
            <p style={{ ...SERIF, fontSize: '0.72rem', color: TEXT_LO }}>
              {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>

        <div className="flex gap-6">

          {/* ── Left sidebar ─────────────────────────────────────────────── */}
          <div style={{ width: 168, flexShrink: 0 }}>

            {/* Stats */}
            <div style={{
              backgroundColor: BG_CARD, border: `1px solid ${BORDER}`,
              borderRadius: 3, padding: '14px', marginBottom: 12, position: 'relative', overflow: 'hidden',
            }}>
              {/* Gold left rule */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: GOLD_DIM }} />
              <div className="pl-2">
                <p style={{ ...SERIF, fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD_DIM, marginBottom: 8 }}>
                  stats
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <p style={{ ...SERIF, fontSize: '2rem', color: streak > 0 ? GOLD : TEXT_MID, lineHeight: 1 }}>{streak}</p>
                    <p style={{ ...SERIF, fontSize: '0.62rem', color: TEXT_LO }}>day streak</p>
                  </div>
                  <div style={{ height: 1, backgroundColor: BORDER }} />
                  <div>
                    <p style={{ ...SERIF, fontSize: '1.3rem', color: TEXT_HI, lineHeight: 1 }}>{totalEntries}</p>
                    <p style={{ ...SERIF, fontSize: '0.62rem', color: TEXT_LO }}>{totalEntries === 1 ? 'entry' : 'entries'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div style={{
              backgroundColor: BG_CARD, border: `1px solid ${BORDER}`,
              borderRadius: 3, padding: '12px', marginBottom: 12,
            }}>
              <p style={{ ...SERIF, fontSize: '0.60rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD_DIM, marginBottom: 10 }}>
                calendar
              </p>
              <MiniCalendar selectedDate={selectedDate} entryDates={entryDates} onSelect={setSelectedDate} />
            </div>

            {/* Recent entries */}
            {entries.length > 0 && (
              <div>
                <p style={{ ...SERIF, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEXT_LO, marginBottom: 8, paddingLeft: 2 }}>
                  recent
                </p>
                <div className="flex flex-col gap-1">
                  {entries.slice(0, 6).map(e => (
                    <button
                      key={e.entry_date}
                      onClick={() => setSelectedDate(e.entry_date)}
                      className="text-left transition-all"
                      style={{
                        padding: '6px 8px',
                        backgroundColor: e.entry_date === selectedDate ? BG_CARD2 : 'transparent',
                        border: e.entry_date === selectedDate ? `1px solid ${BORDER}` : '1px solid transparent',
                        borderRadius: 2,
                      }}
                    >
                      <p style={{ ...SERIF, fontSize: '0.68rem', color: e.entry_date === selectedDate ? GOLD : TEXT_MID }}>
                        {parseLocalDate(e.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      {e.content && (
                        <p style={{ ...SERIF, fontSize: '0.60rem', color: TEXT_LO, marginTop: 1 }} className="line-clamp-1">
                          {e.content.slice(0, 38)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Main writing area ────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {/* Date heading */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {/* Divider with date */}
                    <div className="flex items-center gap-3 mb-1">
                      <div style={{ height: 1, width: 24, backgroundColor: GOLD_DIM }} />
                      <p style={{ ...SERIF, fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD_DIM }}>
                        {isToday ? 'today' : formatDisplayDate(selectedDate)}
                      </p>
                      <div style={{ height: 1, flex: 1, backgroundColor: BORDER }} />
                    </div>
                    {isToday && (
                      <p style={{ ...SERIF, fontSize: '0.78rem', color: TEXT_MID, marginLeft: 3 }}>
                        {formatDisplayDate(selectedDate)}
                      </p>
                    )}
                  </div>
                  <MoodPicker value={mood} onChange={handleMoodChange} />
                </div>

                {/* Prompt */}
                <AnimatePresence>
                  {!content && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginBottom: 10 }}
                    >
                      <div style={{
                        backgroundColor: BG_CARD,
                        border: `1px solid ${BORDER}`,
                        borderLeft: `3px solid ${GOLD_DIM}`,
                        borderRadius: 2,
                        padding: '10px 14px',
                      }}>
                        <p style={{ ...SERIF, fontSize: '0.80rem', color: GOLD_DIM }}>
                          ✦ {prompt}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Writing area — charcoal paper */}
                <div style={{
                  position: 'relative',
                  backgroundColor: BG_CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  {/* Paper grain overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
                    opacity: 0.6,
                  }} />

                  {/* Ruled lines */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
                    backgroundImage: `repeating-linear-gradient(transparent, transparent calc(1.72rem - 1px), rgba(201,168,76,0.07) calc(1.72rem - 1px), rgba(201,168,76,0.07) 1.72rem)`,
                    backgroundPositionY: '24px',
                  }} />

                  <textarea
                    value={content}
                    onChange={e => handleContentChange(e.target.value)}
                    placeholder={prompt}
                    rows={18}
                    className="w-full resize-none outline-none relative"
                    style={{
                      ...SERIF,
                      padding: '24px 24px 20px',
                      fontSize: '0.95rem',
                      lineHeight: '1.72rem',
                      color: TEXT_HI,
                      backgroundColor: 'transparent',
                      caretColor: GOLD,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 px-1">
                  <div className="flex items-center gap-4">
                    {saving && (
                      <span style={{ ...SERIF, fontSize: '0.66rem', color: TEXT_LO }}>saving…</span>
                    )}
                    {!saving && savedAt && (
                      <span style={{ ...SERIF, fontSize: '0.66rem', color: TEXT_LO }}>saved {savedAt}</span>
                    )}
                    {wordCount > 0 && (
                      <span style={{ ...SERIF, fontSize: '0.64rem', color: TEXT_LO }}>
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                      </span>
                    )}
                  </div>

                  {current && !showDeleteConfirm && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{ ...SERIF, fontSize: '0.64rem', color: TEXT_LO }}
                      className="transition-colors hover:text-red-400"
                    >
                      delete
                    </button>
                  )}
                  {showDeleteConfirm && (
                    <div className="flex items-center gap-3">
                      <span style={{ ...SERIF, fontSize: '0.64rem', color: TEXT_MID }}>delete this entry?</span>
                      <button onClick={handleDelete} style={{ ...SERIF, fontSize: '0.64rem', color: '#b45252' }}>yes</button>
                      <button onClick={() => setShowDeleteConfirm(false)} style={{ ...SERIF, fontSize: '0.64rem', color: TEXT_LO }}>cancel</button>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
