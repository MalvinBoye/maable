'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, Habit } from '@maable/core'
import type { TaskPriority } from '@maable/core'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'timeline' | 'calendar'

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

// ─── Calendar view ────────────────────────────────────────────────────────────

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function CalendarView({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const [ref, setRef] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const today = new Date()

  const cells = buildMonthCells(ref)

  // Group tasks by due date key
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

  const prevMonth = () => setRef(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setRef(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const goToday  = () => { const d = new Date(); d.setDate(1); setRef(d) }

  return (
    <div className="px-8 pt-6 pb-16 flex flex-col min-h-0 flex-1">
      {/* Month nav */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button
          onClick={prevMonth}
          className="text-stone-400 hover:text-stone-800 transition-colors px-1"
          style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}
        >←</button>
        <h2
          className="text-2xl text-stone-900 leading-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', minWidth: 220 }}
        >
          {MONTHS[ref.getMonth()]} {ref.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="text-stone-400 hover:text-stone-800 transition-colors px-1"
          style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}
        >→</button>
        <button
          onClick={goToday}
          className="ml-2 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          today
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1 shrink-0">
        {DOW.map(d => (
          <div
            key={d}
            className="text-center py-1"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: '#b8b3ae' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, 1fr)', gap: 1, backgroundColor: 'rgba(26,25,22,0.06)' }}>
        {cells.map((date, i) => {
          const inMonth = date.getMonth() === ref.getMonth()
          const isToday = isSameDay(date, today)
          const key = toDateKey(date)
          const dayTasks = tasksByDate[key] ?? []
          const dow = date.getDay()
          const habitDots = habits.filter(h => {
            if (!h.frequency_days || h.frequency_days.length === 0) return true
            return (h.frequency_days as number[]).includes(dow)
          })

          return (
            <div
              key={i}
              className="flex flex-col p-1.5 gap-0.5"
              style={{
                backgroundColor: inMonth ? '#ffffff' : '#faf9f7',
                minHeight: 90,
              }}
            >
              {/* Date number */}
              <div className="flex items-center justify-between shrink-0 mb-0.5">
                <span
                  className="flex items-center justify-center"
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 11,
                    color: isToday ? '#fff' : inMonth ? '#1a1916' : '#c8c3be',
                    backgroundColor: isToday ? '#1a1916' : 'transparent',
                    fontWeight: isToday ? 600 : 400,
                  }}
                >
                  {date.getDate()}
                </span>
                {/* Habit dots */}
                {inMonth && habitDots.length > 0 && (
                  <div className="flex gap-[3px] flex-wrap justify-end" style={{ maxWidth: 36 }}>
                    {habitDots.slice(0, 4).map(h => (
                      <div
                        key={h.id}
                        style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: h.color, opacity: 0.7 }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Task chips */}
              <div className="flex flex-col gap-[2px]">
                {dayTasks.slice(0, 3).map(t => (
                  <div
                    key={t.id}
                    className="truncate rounded px-1"
                    style={{
                      fontSize: 9,
                      lineHeight: '14px',
                      fontFamily: 'Georgia, serif',
                      color: TASK_COLOR[t.priority] ?? '#78716c',
                      backgroundColor: TASK_BG[t.priority] ?? 'rgba(120,113,108,0.05)',
                      borderLeft: `2px solid ${TASK_COLOR[t.priority] ?? '#78716c'}`,
                    }}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <span style={{ fontSize: 9, color: '#b8b3ae', fontFamily: 'Georgia, serif', fontStyle: 'italic', paddingLeft: 2 }}>
                    +{dayTasks.length - 3} more
                  </span>
                )}
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

const TASK_DURATION: Record<TaskPriority, number> = {
  urgent: 60,
  high:   45,
  medium: 30,
  low:    20,
}

const TASK_COLOR: Record<TaskPriority, string> = {
  urgent: '#dc2626',
  high:   '#ea580c',
  medium: '#2563eb',
  low:    '#78716c',
}

const TASK_BG: Record<TaskPriority, string> = {
  urgent: 'rgba(220,38,38,0.07)',
  high:   'rgba(234,88,12,0.07)',
  medium: 'rgba(37,99,235,0.07)',
  low:    'rgba(120,113,108,0.05)',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleBlock {
  id: string
  type: 'task' | 'habit' | 'break'
  label: string
  startMin: number
  durationMin: number
  color: string
  bgColor: string
  priority?: TaskPriority
  emoji?: string | null
}

// ─── Algorithm ────────────────────────────────────────────────────────────────

function buildSchedule(
  tasks: Task[],
  habits: Habit[],
  startHour: number,
  endHour: number,
): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = []
  const dayStart = startHour * 60
  const dayEnd = endHour * 60
  let cursor = dayStart + 15

  const sorted = [...tasks]
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      const o: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
      const d = (o[a.priority] ?? 3) - (o[b.priority] ?? 3)
      if (d !== 0) return d
      if (a.due_date && b.due_date) return Date.parse(a.due_date) - Date.parse(b.due_date)
      return a.due_date ? -1 : b.due_date ? 1 : 0
    })
    .slice(0, 10)

  // Morning habits (up to 2)
  const morningHabits = habits.slice(0, Math.min(2, habits.length))
  for (const h of morningHabits) {
    if (cursor + 25 > dayEnd) break
    blocks.push({
      id: h.id,
      type: 'habit',
      label: h.title,
      startMin: cursor,
      durationMin: 25,
      color: h.color,
      bgColor: `${h.color}18`,
      emoji: h.icon,
    })
    cursor += 30
  }

  let taskCount = 0
  for (const task of sorted) {
    const dur = TASK_DURATION[task.priority] ?? 30

    // Lunch at noon if we're crossing it
    if (cursor < 12 * 60 && cursor + dur > 12 * 60) {
      blocks.push({
        id: 'lunch',
        type: 'break',
        label: 'Lunch',
        startMin: 12 * 60,
        durationMin: 60,
        color: '#b45309',
        bgColor: 'rgba(180,83,9,0.07)',
        emoji: null,
      })
      cursor = 13 * 60
    }

    if (cursor + dur > dayEnd) break

    blocks.push({
      id: task.id,
      type: 'task',
      label: task.title,
      startMin: cursor,
      durationMin: dur,
      color: TASK_COLOR[task.priority] ?? '#78716c',
      bgColor: TASK_BG[task.priority] ?? 'rgba(120,113,108,0.05)',
      priority: task.priority,
    })
    cursor += dur
    taskCount++

    // Short break every 2 tasks
    if (taskCount % 2 === 0 && cursor + 10 <= dayEnd) {
      blocks.push({
        id: `brk-${taskCount}`,
        type: 'break',
        label: 'Break',
        startMin: cursor,
        durationMin: 10,
        color: '#a8a29e',
        bgColor: 'rgba(26,25,22,0.03)',
      })
      cursor += 10
    }
  }

  // Evening habits
  for (const h of habits.slice(morningHabits.length)) {
    if (cursor + 25 > dayEnd) break
    blocks.push({
      id: `${h.id}-eve`,
      type: 'habit',
      label: h.title,
      startMin: cursor,
      durationMin: 25,
      color: h.color,
      bgColor: `${h.color}18`,
      emoji: h.icon,
    })
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

// ─── Block ────────────────────────────────────────────────────────────────────

function Block({ block, dayStart, animDelay }: { block: ScheduleBlock; dayStart: number; animDelay: number }) {
  const top = (block.startMin - dayStart) * PX_PER_MIN
  const height = Math.max(block.durationMin * PX_PER_MIN, 10)
  const isCompact = height < 28

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, delay: animDelay }}
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 4,
        height,
        backgroundColor: block.bgColor,
        borderLeft: `2.5px solid ${block.color}`,
        paddingLeft: 8,
        paddingRight: 6,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        cursor: block.type === 'task' ? 'pointer' : 'default',
      }}
      whileHover={block.type === 'task' ? { x: 3 } : {}}
    >
      {!isCompact ? (
        <div className="flex items-center gap-1.5 w-full min-w-0">
          {block.emoji && (
            <span style={{ fontSize: 11, flexShrink: 0 }}>{block.emoji}</span>
          )}
          <span
            className="text-xs leading-snug truncate"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: block.type === 'habit' ? 'italic' : 'normal',
              color: block.color,
            }}
          >
            {block.label}
          </span>
          {block.type === 'task' && (
            <span
              className="text-xs ml-auto flex-shrink-0"
              style={{ color: block.color, opacity: 0.4, fontFamily: 'Georgia, serif' }}
            >
              {block.durationMin}m
            </span>
          )}
        </div>
      ) : (
        <span
          className="text-xs truncate w-full"
          style={{ color: block.color, fontFamily: 'Georgia, serif', opacity: 0.7 }}
        >
          {block.label}
        </span>
      )}
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ScheduleClient({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [startHour, setStartHour] = useState(DEFAULT_START)
  const [endHour, setEndHour] = useState(DEFAULT_END)
  const [animKey, setAnimKey] = useState(0)
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date()
      setNowMin(d.getHours() * 60 + d.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const blocks = useMemo(
    () => buildSchedule(tasks, habits, startHour, endHour),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, habits, startHour, endHour, animKey],
  )

  const dayStart = startHour * 60
  const dayEnd = endHour * 60
  const totalPx = (dayEnd - dayStart) * PX_PER_MIN
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  const nowInRange = nowMin >= dayStart && nowMin <= dayEnd
  const nowTop = (nowMin - dayStart) * PX_PER_MIN

  const taskBlocks = blocks.filter((b) => b.type === 'task')
  const habitBlocks = blocks.filter((b) => b.type === 'habit')
  const totalMins = blocks.reduce((s, b) => s + b.durationMin, 0)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 5) // 5am-9pm

  return (
    <div
      className="flex h-[calc(100dvh-4.5rem)] overflow-hidden"
      style={{ backgroundColor: 'var(--paper, #fff)' }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 py-8 pl-10 pr-6 overflow-y-auto"
        style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)', scrollbarWidth: 'none' }}
      >
        <h1
          className="text-4xl text-stone-900 mb-1 leading-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Schedule
        </h1>
        <p className="text-sm text-stone-400 mb-5">{today}</p>

        {/* View toggle */}
        <div
          className="flex mb-6 shrink-0"
          style={{ border: '1px solid rgba(26,25,22,0.10)', borderRadius: 8, overflow: 'hidden' }}
        >
          {(['timeline', 'calendar'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className="flex-1 py-1.5 text-xs transition-colors capitalize"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                backgroundColor: viewMode === v ? '#1a1916' : 'transparent',
                color: viewMode === v ? '#fff' : '#78716c',
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-5 mb-7">
          {[
            { n: taskBlocks.length, label: 'tasks' },
            { n: habitBlocks.length, label: 'habits' },
            { n: Math.round(totalMins / 60 * 10) / 10, label: 'hrs planned' },
          ].map(({ n, label }) => (
            <div key={label}>
              <p
                className="text-2xl text-stone-800 leading-none"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {n}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Priority legend */}
        <p className="text-xs text-stone-300 mb-2.5 tracking-widest uppercase">Time estimates</p>
        <div className="flex flex-col gap-2 mb-7">
          {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
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

        {/* Time range — timeline only */}
        {viewMode === 'timeline' && <><p className="text-xs text-stone-300 mb-2.5 tracking-widest uppercase">Day window</p>
        <div className="flex gap-3 mb-7">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Start</label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="text-xs text-stone-700 bg-transparent outline-none cursor-pointer"
              style={{ border: '1px solid rgba(26,25,22,0.12)', padding: '3px 6px', fontFamily: 'Georgia, serif' }}
            >
              {HOUR_OPTIONS.filter((h) => h < endHour).map((h) => (
                <option key={h} value={h}>{fmtHour(h)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>End</label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="text-xs text-stone-700 bg-transparent outline-none cursor-pointer"
              style={{ border: '1px solid rgba(26,25,22,0.12)', padding: '3px 6px', fontFamily: 'Georgia, serif' }}
            >
              {HOUR_OPTIONS.filter((h) => h > startHour).map((h) => (
                <option key={h} value={h}>{fmtHour(h)}</option>
              ))}
            </select>
          </div>
        </div>

        </>}

        <div className="flex-1" />

        {viewMode === 'timeline' && (
          <>
            <motion.button
              onClick={() => setAnimKey((k) => k + 1)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors self-start mb-4"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                borderBottom: '1px solid rgba(26,25,22,0.15)',
                paddingBottom: 2,
              }}
            >
              ↺ Rebuild plan
            </motion.button>
            <p className="text-xs text-stone-300 leading-relaxed">
              Urgent first. Breaks every 2 tasks. Habits bookend morning and evening.
            </p>
          </>
        )}
      </aside>

      {/* ── Main panel ───────────────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto flex flex-col"
        style={{ scrollbarWidth: 'none' }}
      >
        <style>{`main::-webkit-scrollbar { display: none; }`}</style>

        {viewMode === 'calendar' ? (
          <CalendarView tasks={tasks} habits={habits} />
        ) : (
        <div className="px-10 pt-8 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', height: totalPx + 32, position: 'relative' }}
            >
              {/* Hour labels */}
              <div style={{ width: 68, flexShrink: 0, position: 'relative' }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      position: 'absolute',
                      top: (h - startHour) * 60 * PX_PER_MIN - 7,
                      right: 14,
                      fontSize: 10,
                      color: '#b8b3ae',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fmtHour(h)}
                  </div>
                ))}
              </div>

              {/* Grid + blocks */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* Hour grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      position: 'absolute',
                      top: (h - startHour) * 60 * PX_PER_MIN,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: h % 2 === 0
                        ? 'rgba(26,25,22,0.06)'
                        : 'rgba(26,25,22,0.03)',
                    }}
                  />
                ))}

                {/* Now indicator */}
                {nowInRange && (
                  <div
                    style={{
                      position: 'absolute',
                      top: nowTop,
                      left: -8,
                      right: 0,
                      height: 1,
                      backgroundColor: '#ef4444',
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: -3.5,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: -8,
                        fontSize: 9,
                        color: '#ef4444',
                        fontFamily: 'Georgia, serif',
                        fontStyle: 'italic',
                      }}
                    >
                      {fmtTime(nowMin)}
                    </span>
                  </div>
                )}

                {/* Schedule blocks */}
                {blocks.map((block, i) => (
                  <Block
                    key={block.id}
                    block={block}
                    dayStart={dayStart}
                    animDelay={i * 0.04}
                  />
                ))}

                {/* Empty state */}
                {blocks.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center h-full gap-3"
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    <p
                      className="text-stone-400 text-sm"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      No tasks or habits to schedule.
                    </p>
                    <p className="text-stone-300 text-xs">Add tasks and habits to build your day.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        )}
      </main>
    </div>
  )
}
