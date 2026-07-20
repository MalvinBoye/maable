'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, Habit } from '@maable/core'
import type { TaskPriority } from '@maable/core'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'timeline' | 'calendar'

interface ScheduleBlock {
  id: string
  type: 'task' | 'habit' | 'break' | 'manual'
  label: string
  startMin: number
  durationMin: number
  color: string
  bgColor: string
  priority?: TaskPriority
  emoji?: string | null
}

interface BlockOverride {
  label: string
  startMin: number
  durationMin: number
}

// ─── >>time<< parser ─────────────────────────────────────────────────────────

function parseTimeTag(input: string): { clean: string; startMin: number | null } {
  const match = input.match(/>>(.+?)<</)
  if (!match) return { clean: input.trim(), startMin: null }

  const clean = input.replace(/>>(.+?)<</, '').replace(/\s+/g, ' ').trim()
  const tag = match[1]!.trim().toLowerCase()

  const now = new Date()
  const base = new Date(now)

  if (tag.includes('tomorrow')) {
    base.setDate(base.getDate() + 1)
  } else {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const di = days.findIndex(d => tag.startsWith(d))
    if (di !== -1 && !tag.startsWith('today')) {
      const diff = (di - now.getDay() + 7) % 7 || 7
      base.setDate(base.getDate() + diff)
    }
  }

  // Match time: 1:15pm, 9am, 14:30, 9:30 am
  const tm = tag.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (!tm) return { clean: clean || input.trim(), startMin: null }

  let h = parseInt(tm[1]!)
  const m = parseInt(tm[2] ?? '0')
  const mer = tm[3]

  if (mer === 'pm' && h !== 12) h += 12
  if (mer === 'am' && h === 12) h = 0
  // No meridiem + single-digit hour + feels like afternoon → leave as-is (user said 9 → 9am)

  return { clean: clean || input.trim(), startMin: h * 60 + m }
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function buildMonthCells(ref: Date): Date[] {
  const y = ref.getFullYear(), m = ref.getMonth()
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: Date[] = []
  for (let i = firstDow; i > 0; i--) cells.push(new Date(y, m, 1 - i))
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))
  let next = 1
  while (cells.length < 42) cells.push(new Date(y, m + 1, next++))
  return cells
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function CalendarView({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const [ref, setRef] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const today = new Date()
  const cells = buildMonthCells(ref)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const t of tasks) {
      if (!t.due_date) continue
      const k = t.due_date.slice(0, 10)
      if (!map[k]) map[k] = []
      map[k]!.push(t)
    }
    return map
  }, [tasks])

  return (
    <div className="px-8 pt-6 pb-16 flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button onClick={() => setRef(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-stone-400 hover:text-stone-800 transition-colors px-1" style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}>←</button>
        <h2 className="text-2xl text-stone-900 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', minWidth: 220 }}>{MONTHS[ref.getMonth()]} {ref.getFullYear()}</h2>
        <button onClick={() => setRef(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-stone-400 hover:text-stone-800 transition-colors px-1" style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}>→</button>
        <button onClick={() => { const d = new Date(); d.setDate(1); setRef(d) }} className="ml-2 text-xs text-stone-400 hover:text-stone-700 transition-colors" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>today</button>
      </div>
      <div className="grid grid-cols-7 mb-1 shrink-0">
        {DOW.map(d => <div key={d} className="text-center py-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: '#b8b3ae' }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, 1fr)', gap: 1, backgroundColor: 'rgba(26,25,22,0.06)' }}>
        {cells.map((date, i) => {
          const inMonth = date.getMonth() === ref.getMonth()
          const isToday = isSameDay(date, today)
          const key = toDateKey(date)
          const dayTasks = tasksByDate[key] ?? []
          const dow = date.getDay()
          const habitDots = habits.filter(h => !h.frequency_days || (h.frequency_days as number[]).includes(dow))
          return (
            <div key={i} className="flex flex-col p-1.5 gap-0.5" style={{ backgroundColor: inMonth ? '#ffffff' : '#faf9f7', minHeight: 90 }}>
              <div className="flex items-center justify-between shrink-0 mb-0.5">
                <span className="flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: '50%', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: isToday ? '#fff' : inMonth ? '#1a1916' : '#c8c3be', backgroundColor: isToday ? '#1a1916' : 'transparent' }}>
                  {date.getDate()}
                </span>
                {inMonth && habitDots.length > 0 && (
                  <div className="flex gap-[3px] flex-wrap justify-end" style={{ maxWidth: 36 }}>
                    {habitDots.slice(0, 4).map(h => <div key={h.id} style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: h.color, opacity: 0.7 }} />)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-[2px]">
                {dayTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="truncate rounded px-1" style={{ fontSize: 9, lineHeight: '14px', fontFamily: 'Georgia, serif', color: TASK_COLOR[t.priority] ?? '#78716c', backgroundColor: TASK_BG[t.priority] ?? 'rgba(120,113,108,0.05)', borderLeft: `2px solid ${TASK_COLOR[t.priority] ?? '#78716c'}` }}>{t.title}</div>
                ))}
                {dayTasks.length > 3 && <span style={{ fontSize: 9, color: '#b8b3ae', fontFamily: 'Georgia, serif', fontStyle: 'italic', paddingLeft: 2 }}>+{dayTasks.length - 3} more</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PX_PER_MIN = 1.2
const DEFAULT_START = 8
const DEFAULT_END = 22

const TASK_DURATION: Record<TaskPriority, number> = { urgent: 60, high: 45, medium: 30, low: 20 }
const TASK_COLOR: Record<TaskPriority, string> = { urgent: '#dc2626', high: '#ea580c', medium: '#2563eb', low: '#78716c' }
const TASK_BG: Record<TaskPriority, string> = { urgent: 'rgba(220,38,38,0.07)', high: 'rgba(234,88,12,0.07)', medium: 'rgba(37,99,235,0.07)', low: 'rgba(120,113,108,0.05)' }

const MANUAL_COLOR = '#059669'
const MANUAL_BG    = 'rgba(5,150,105,0.07)'

// ─── Schedule algorithm ───────────────────────────────────────────────────────

function buildSchedule(tasks: Task[], habits: Habit[], startHour: number, endHour: number): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = []
  const dayStart = startHour * 60
  const dayEnd = endHour * 60
  let cursor = dayStart + 15

  const sorted = [...tasks]
    .filter(t => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      const o: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
      const d = (o[a.priority] ?? 3) - (o[b.priority] ?? 3)
      if (d !== 0) return d
      if (a.due_date && b.due_date) return Date.parse(a.due_date) - Date.parse(b.due_date)
      return a.due_date ? -1 : b.due_date ? 1 : 0
    })
    .slice(0, 10)

  const morningHabits = habits.slice(0, Math.min(2, habits.length))
  for (const h of morningHabits) {
    if (cursor + 25 > dayEnd) break
    blocks.push({ id: h.id, type: 'habit', label: h.title, startMin: cursor, durationMin: 25, color: h.color, bgColor: `${h.color}18`, emoji: h.icon })
    cursor += 30
  }

  let taskCount = 0
  for (const task of sorted) {
    const dur = TASK_DURATION[task.priority] ?? 30
    if (cursor < 12 * 60 && cursor + dur > 12 * 60) {
      blocks.push({ id: 'lunch', type: 'break', label: 'Lunch', startMin: 12 * 60, durationMin: 60, color: '#b45309', bgColor: 'rgba(180,83,9,0.07)', emoji: null })
      cursor = 13 * 60
    }
    if (cursor + dur > dayEnd) break
    blocks.push({ id: task.id, type: 'task', label: task.title, startMin: cursor, durationMin: dur, color: TASK_COLOR[task.priority] ?? '#78716c', bgColor: TASK_BG[task.priority] ?? 'rgba(120,113,108,0.05)', priority: task.priority })
    cursor += dur
    taskCount++
    if (taskCount % 2 === 0 && cursor + 10 <= dayEnd) {
      blocks.push({ id: `brk-${taskCount}`, type: 'break', label: 'Break', startMin: cursor, durationMin: 10, color: '#a8a29e', bgColor: 'rgba(26,25,22,0.03)' })
      cursor += 10
    }
  }

  for (const h of habits.slice(morningHabits.length)) {
    if (cursor + 25 > dayEnd) break
    blocks.push({ id: `${h.id}-eve`, type: 'habit', label: h.title, startMin: cursor, durationMin: 25, color: h.color, bgColor: `${h.color}18`, emoji: h.icon })
    cursor += 30
  }

  return blocks
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHour(h: number) {
  if (h === 0 || h === 24) return '12 am'
  if (h === 12) return '12 pm'
  return h > 12 ? `${h - 12} pm` : `${h} am`
}

function fmtTime(totalMin: number) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const label = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12} ${label}` : `${h12}:${String(m).padStart(2, '0')} ${label}`
}

function minToTimeInput(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeInputToMin(val: string) {
  const [h, m] = val.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

// ─── Edit drawer ──────────────────────────────────────────────────────────────

function EditDrawer({
  block,
  isManual,
  onSave,
  onDelete,
  onClose,
}: {
  block: ScheduleBlock
  isManual: boolean
  onSave: (label: string, startMin: number, durationMin: number) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [label, setLabel]       = useState(block.label)
  const [timeVal, setTimeVal]   = useState(minToTimeInput(block.startMin))
  const [duration, setDuration] = useState(block.durationMin)
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => { labelRef.current?.focus() }, [])

  const G = { fontFamily: 'Georgia, serif' as const, fontStyle: 'italic' as const }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 32px', pointerEvents: 'none' }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        style={{
          pointerEvents: 'auto',
          background: '#fff',
          border: '1px solid rgba(26,25,22,0.10)',
          borderRadius: 16,
          boxShadow: '0 8px 48px rgba(0,0,0,0.12)',
          padding: '20px 24px',
          width: 'min(96vw, 420px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...G, fontSize: '0.78rem', color: 'rgba(26,25,22,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {isManual ? 'edit block' : 'reschedule'}
          </span>
          <button onClick={onClose} style={{ ...G, fontSize: '0.75rem', color: 'rgba(26,25,22,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
            close
          </button>
        </div>

        {/* Label */}
        <div>
          <label style={{ ...G, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.35)', display: 'block', marginBottom: 6 }}>label</label>
          <input
            ref={labelRef}
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={{ ...G, width: '100%', fontSize: '0.92rem', color: '#1a1916', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(26,25,22,0.15)', paddingBottom: 4, outline: 'none' }}
            onKeyDown={e => { if (e.key === 'Enter') onSave(label, timeInputToMin(timeVal), duration) }}
          />
        </div>

        {/* Time + Duration row */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...G, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.35)', display: 'block', marginBottom: 6 }}>start time</label>
            <input
              type="time"
              value={timeVal}
              onChange={e => setTimeVal(e.target.value)}
              style={{ ...G, fontSize: '0.88rem', color: '#1a1916', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(26,25,22,0.15)', paddingBottom: 4, outline: 'none', width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...G, fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.35)', display: 'block', marginBottom: 6 }}>duration</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(26,25,22,0.15)', paddingBottom: 4 }}>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                style={{ ...G, width: 48, fontSize: '0.88rem', color: '#1a1916', background: 'transparent', border: 'none', outline: 'none' }}
              />
              <span style={{ ...G, fontSize: '0.72rem', color: 'rgba(26,25,22,0.38)' }}>min</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          {isManual && (
            <button
              onClick={onDelete}
              style={{ ...G, flex: 1, padding: '8px', fontSize: '0.78rem', color: '#dc2626', border: '1px solid rgba(220,38,38,0.20)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
            >
              remove
            </button>
          )}
          <button
            onClick={() => onSave(label, timeInputToMin(timeVal), duration)}
            style={{ ...G, flex: 2, padding: '8px', fontSize: '0.78rem', color: '#fff', background: '#1a1916', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Block ────────────────────────────────────────────────────────────────────

function Block({
  block, dayStart, animDelay, onEdit,
}: {
  block: ScheduleBlock; dayStart: number; animDelay: number
  onEdit: (block: ScheduleBlock) => void
}) {
  const top    = (block.startMin - dayStart) * PX_PER_MIN
  const height = Math.max(block.durationMin * PX_PER_MIN, 10)
  const isCompact = height < 28

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, delay: animDelay }}
      onClick={() => onEdit(block)}
      style={{
        position: 'absolute', top, left: 0, right: 4, height,
        backgroundColor: block.bgColor,
        borderLeft: `2.5px solid ${block.color}`,
        paddingLeft: 8, paddingRight: 6,
        display: 'flex', alignItems: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      whileHover={{ x: 3 }}
    >
      {!isCompact ? (
        <div className="flex items-center gap-1.5 w-full min-w-0">
          {block.emoji && <span style={{ fontSize: 11, flexShrink: 0 }}>{block.emoji}</span>}
          <span className="text-xs leading-snug truncate" style={{ fontFamily: 'Georgia, serif', fontStyle: block.type === 'habit' ? 'italic' : 'normal', color: block.color }}>
            {block.label}
          </span>
          <span className="text-xs ml-auto flex-shrink-0" style={{ color: block.color, opacity: 0.4, fontFamily: 'Georgia, serif' }}>
            {block.durationMin}m
          </span>
        </div>
      ) : (
        <span className="text-xs truncate w-full" style={{ color: block.color, fontFamily: 'Georgia, serif', opacity: 0.7 }}>
          {block.label}
        </span>
      )}
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'maable-schedule-manual'
const OVERRIDES_KEY = 'maable-schedule-overrides'

export function ScheduleClient({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [startHour, setStartHour] = useState(DEFAULT_START)
  const [endHour, setEndHour] = useState(DEFAULT_END)
  const [animKey, setAnimKey] = useState(0)
  const [nowMin, setNowMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() })

  // Manual blocks + overrides stored in localStorage
  const [manualBlocks, setManualBlocks] = useState<ScheduleBlock[]>([])
  const [overrides, setOverrides]       = useState<Record<string, BlockOverride>>({})
  const lsLoaded = useRef(false)

  const [addInput, setAddInput] = useState('')
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)
  const addRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()) }, 60_000)
    return () => clearInterval(id)
  }, [])

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ScheduleBlock[]
      const o = JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}') as Record<string, BlockOverride>
      setManualBlocks(m)
      setOverrides(o)
    } catch { /* ignore */ }
    lsLoaded.current = true
  }, [])

  useEffect(() => {
    if (!lsLoaded.current) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(manualBlocks)) } catch { /* ignore */ }
  }, [manualBlocks])

  useEffect(() => {
    if (!lsLoaded.current) return
    try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides)) } catch { /* ignore */ }
  }, [overrides])

  const autoBlocks = useMemo(
    () => buildSchedule(tasks, habits, startHour, endHour),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, habits, startHour, endHour, animKey],
  )

  // Apply overrides to auto blocks
  const resolvedAuto: ScheduleBlock[] = autoBlocks.map(b => {
    const ov = overrides[b.id]
    if (!ov) return b
    return { ...b, label: ov.label, startMin: ov.startMin, durationMin: ov.durationMin }
  })

  const blocks: ScheduleBlock[] = [...resolvedAuto, ...manualBlocks]
    .sort((a, b) => a.startMin - b.startMin)

  const dayStart = startHour * 60
  const dayEnd   = endHour * 60
  const totalPx  = (dayEnd - dayStart) * PX_PER_MIN
  const hours    = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  const nowInRange = nowMin >= dayStart && nowMin <= dayEnd
  const nowTop = (nowMin - dayStart) * PX_PER_MIN

  const taskBlocks  = blocks.filter(b => b.type === 'task')
  const habitBlocks = blocks.filter(b => b.type === 'habit')
  const totalMins   = blocks.reduce((s, b) => s + b.durationMin, 0)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 5)

  // Quick-add a manual block
  function handleAdd() {
    const raw = addInput.trim()
    if (!raw) return
    const { clean, startMin } = parseTimeTag(raw)
    const label = clean || raw
    const newBlock: ScheduleBlock = {
      id: `manual-${Date.now()}`,
      type: 'manual',
      label,
      startMin: startMin ?? nowMin,
      durationMin: 30,
      color: MANUAL_COLOR,
      bgColor: MANUAL_BG,
    }
    setManualBlocks(prev => [...prev, newBlock])
    setAddInput('')
  }

  function handleEditSave(label: string, startMin: number, durationMin: number) {
    if (!editingBlock) return
    if (editingBlock.type === 'manual') {
      setManualBlocks(prev => prev.map(b => b.id === editingBlock.id ? { ...b, label, startMin, durationMin } : b))
    } else {
      setOverrides(prev => ({ ...prev, [editingBlock.id]: { label, startMin, durationMin } }))
    }
    setEditingBlock(null)
  }

  function handleEditDelete() {
    if (!editingBlock) return
    if (editingBlock.type === 'manual') {
      setManualBlocks(prev => prev.filter(b => b.id !== editingBlock.id))
    } else {
      setOverrides(prev => { const n = { ...prev }; delete n[editingBlock.id]; return n })
    }
    setEditingBlock(null)
  }

  // The block shown in the edit drawer (with current overrides applied)
  const editTarget = editingBlock
    ? (blocks.find(b => b.id === editingBlock.id) ?? editingBlock)
    : null

  const G = { fontFamily: 'Georgia, serif' as const, fontStyle: 'italic' as const }

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden" style={{ backgroundColor: 'var(--paper, #fff)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="flex flex-col shrink-0 py-8 pl-10 pr-6 overflow-y-auto" style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)', scrollbarWidth: 'none' }}>
        <h1 className="text-4xl text-stone-900 mb-1 leading-none" style={{ ...G }}>Schedule</h1>
        <p className="text-sm text-stone-400 mb-5">{today}</p>

        {/* View toggle */}
        <div className="flex mb-6 shrink-0" style={{ border: '1px solid rgba(26,25,22,0.10)', borderRadius: 8, overflow: 'hidden' }}>
          {(['timeline', 'calendar'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setViewMode(v)} className="flex-1 py-1.5 text-xs transition-colors capitalize" style={{ ...G, backgroundColor: viewMode === v ? '#1a1916' : 'transparent', color: viewMode === v ? '#fff' : '#78716c' }}>{v}</button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-5 mb-7">
          {[{ n: taskBlocks.length, label: 'tasks' }, { n: habitBlocks.length, label: 'habits' }, { n: Math.round(totalMins / 60 * 10) / 10, label: 'hrs planned' }].map(({ n, label }) => (
            <div key={label}>
              <p className="text-2xl text-stone-800 leading-none" style={{ ...G }}>{n}</p>
              <p className="text-xs text-stone-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick add — timeline only */}
        {viewMode === 'timeline' && (
          <div className="mb-7">
            <p className="text-xs text-stone-300 mb-2.5 tracking-widest uppercase">Add block</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                ref={addRef}
                value={addInput}
                onChange={e => setAddInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                placeholder="Label >>today at 2pm<<"
                style={{
                  ...G, flex: 1, fontSize: '0.78rem', color: '#1a1916',
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(26,25,22,0.15)',
                  paddingBottom: 4, outline: 'none',
                  '::placeholder': { color: 'rgba(26,25,22,0.25)' },
                } as React.CSSProperties}
              />
              <button
                onClick={handleAdd}
                disabled={!addInput.trim()}
                style={{ ...G, fontSize: '0.78rem', color: addInput.trim() ? '#1a1916' : 'rgba(26,25,22,0.25)', background: 'none', border: 'none', cursor: addInput.trim() ? 'pointer' : 'default', paddingBottom: 4 }}
              >
                +
              </button>
            </div>
            <p style={{ ...G, fontSize: '0.62rem', color: 'rgba(26,25,22,0.28)', marginTop: 5, lineHeight: 1.5 }}>
              Use <span style={{ color: 'rgba(26,25,22,0.45)' }}>{'>>'}</span>today at 2pm<span style={{ color: 'rgba(26,25,22,0.45)' }}>{'<<'}</span> to set time
            </p>
          </div>
        )}

        {/* Priority legend */}
        <p className="text-xs text-stone-300 mb-2.5 tracking-widest uppercase">Time estimates</p>
        <div className="flex flex-col gap-2 mb-7">
          {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
            <div key={p} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: TASK_COLOR[p] }} />
              <span className="text-xs text-stone-500 capitalize">{p}</span>
              <span className="text-xs text-stone-300 ml-auto">{TASK_DURATION[p]}m</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm flex-shrink-0 bg-stone-300" />
            <span className="text-xs text-stone-500">Habit</span>
            <span className="text-xs text-stone-300 ml-auto">25m</span>
          </div>
        </div>

        {/* Day window */}
        {viewMode === 'timeline' && (
          <>
            <p className="text-xs text-stone-300 mb-2.5 tracking-widest uppercase">Day window</p>
            <div className="flex gap-3 mb-7">
              {([['Start', startHour, setStartHour, HOUR_OPTIONS.filter(h => h < endHour)] as const, ['End', endHour, setEndHour, HOUR_OPTIONS.filter(h => h > startHour)] as const]).map(([label, val, set, opts]) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs text-stone-400" style={{ ...G }}>{label}</label>
                  <select value={val} onChange={e => set(Number(e.target.value))} className="text-xs text-stone-700 bg-transparent outline-none cursor-pointer" style={{ border: '1px solid rgba(26,25,22,0.12)', padding: '3px 6px', ...G }}>
                    {opts.map(h => <option key={h} value={h}>{fmtHour(h)}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex-1" />

        {viewMode === 'timeline' && (
          <>
            <motion.button
              onClick={() => setAnimKey(k => k + 1)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors self-start mb-4"
              style={{ ...G, borderBottom: '1px solid rgba(26,25,22,0.15)', paddingBottom: 2 }}
            >
              ↺ Rebuild plan
            </motion.button>
            <p className="text-xs text-stone-300 leading-relaxed">
              Click any block to edit time or label. Urgent first. Breaks every 2 tasks.
            </p>
          </>
        )}
      </aside>

      {/* ── Main panel ───────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col" style={{ scrollbarWidth: 'none' }}>
        <style>{`main::-webkit-scrollbar { display: none; }`}</style>

        {viewMode === 'calendar' ? (
          <CalendarView tasks={tasks} habits={habits} />
        ) : (
          <div className="px-10 pt-8 pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={animKey}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', height: totalPx + 32, position: 'relative' }}
              >
                {/* Hour labels */}
                <div style={{ width: 68, flexShrink: 0, position: 'relative' }}>
                  {hours.map(h => (
                    <div key={h} style={{ position: 'absolute', top: (h - startHour) * 60 * PX_PER_MIN - 7, right: 14, fontSize: 10, color: '#b8b3ae', fontFamily: 'Georgia, serif', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                      {fmtHour(h)}
                    </div>
                  ))}
                </div>

                {/* Grid + blocks */}
                <div style={{ flex: 1, position: 'relative' }}>
                  {hours.map(h => (
                    <div key={h} style={{ position: 'absolute', top: (h - startHour) * 60 * PX_PER_MIN, left: 0, right: 0, height: 1, backgroundColor: h % 2 === 0 ? 'rgba(26,25,22,0.06)' : 'rgba(26,25,22,0.03)' }} />
                  ))}

                  {/* Now indicator */}
                  {nowInRange && (
                    <div style={{ position: 'absolute', top: nowTop, left: -8, right: 0, height: 1, backgroundColor: '#ef4444', zIndex: 10 }}>
                      <div style={{ position: 'absolute', left: 0, top: -3.5, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      <span style={{ position: 'absolute', right: 0, top: -8, fontSize: 9, color: '#ef4444', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{fmtTime(nowMin)}</span>
                    </div>
                  )}

                  {blocks.map((block, i) => (
                    <Block key={block.id} block={block} dayStart={dayStart} animDelay={i * 0.04} onEdit={setEditingBlock} />
                  ))}

                  {blocks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3" style={{ position: 'absolute', inset: 0 }}>
                      <p className="text-stone-400 text-sm" style={{ ...G }}>No tasks or habits to schedule.</p>
                      <p className="text-stone-300 text-xs">Add tasks and habits, or type a block above.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Edit drawer ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editTarget && (
          <EditDrawer
            key={editTarget.id}
            block={editTarget}
            isManual={editTarget.type === 'manual'}
            onSave={handleEditSave}
            onDelete={handleEditDelete}
            onClose={() => setEditingBlock(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
