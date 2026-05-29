'use client'

import { useState, useOptimistic, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit, HabitCompletion, HabitFrequency } from '@maable/core'
import { logCompletion, removeCompletion, createHabit, archiveHabit } from './actions'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HabitsClientProps {
  habits: Habit[]
  completions: HabitCompletion[]
  today: string // YYYY-MM-DD
}

type CompletionMap = Map<string, number> // habitId → count today

type OptimisticAction =
  | { type: 'log'; habitId: string }
  | { type: 'remove'; habitId: string }
  | { type: 'add'; habit: Habit }
  | { type: 'archive'; habitId: string }

interface HabitsState {
  habits: Habit[]
  completionMap: CompletionMap
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildCompletionMap(completions: HabitCompletion[], today: string): CompletionMap {
  const map = new Map<string, number>()
  for (const c of completions) {
    if (c.completed_date === today) {
      map.set(c.habit_id, (map.get(c.habit_id) ?? 0) + c.count)
    }
  }
  return map
}

function getLast7Days(today: string): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const FREQ_LABEL: Record<HabitFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  custom: 'Custom',
}

const PALETTE = [
  '#1a1916', '#78716c', '#a8a29e',
  '#d4a843', '#ef4444', '#4ade80',
  '#60a5fa', '#c084fc', '#f97316',
]

// ─── Ring ─────────────────────────────────────────────────────────────────────

function CompletionRing({
  progress,
  color,
  size = 64,
}: {
  progress: number // 0–1
  color: string
  size?: number
}) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(progress, 1)

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(26,25,22,0.08)"
        strokeWidth={4}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        animate={{ strokeDashoffset: circ - dash }}
        initial={false}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{ rotate: '-90deg', transformOrigin: '50% 50%' }}
      />
      {progress >= 1 && (
        <motion.text
          x={size / 2} y={size / 2 + 5}
          textAnchor="middle"
          fontSize={size * 0.28}
          fill={color}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          style={{ fontFamily: 'Georgia, serif' }}
        >
          ✓
        </motion.text>
      )}
    </svg>
  )
}

// ─── 7-day dot strip ───────────────────────────────────────────────────────────

function WeekStrip({
  habitId,
  completions,
  last7,
  color,
}: {
  habitId: string
  completions: HabitCompletion[]
  last7: string[]
  color: string
}) {
  const dayMap = new Map<string, number>()
  for (const c of completions) {
    if (c.habit_id === habitId) {
      dayMap.set(c.completed_date, (dayMap.get(c.completed_date) ?? 0) + c.count)
    }
  }

  return (
    <div className="flex items-center gap-1.5 mt-3">
      {last7.map((d) => {
        const done = (dayMap.get(d) ?? 0) > 0
        const isToday = d === last7[last7.length - 1]
        return (
          <div
            key={d}
            title={d}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              backgroundColor: done ? color : 'rgba(26,25,22,0.1)',
              outline: isToday ? `1.5px solid ${color}` : 'none',
              outlineOffset: '1.5px',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Habit card ────────────────────────────────────────────────────────────────

function HabitCard({
  habit,
  todayCount,
  completions,
  last7,
  onLog,
  onRemove,
  onArchive,
}: {
  habit: Habit
  todayCount: number
  completions: HabitCompletion[]
  last7: string[]
  onLog: () => void
  onRemove: () => void
  onArchive: () => void
}) {
  const progress = todayCount / habit.target_count
  const done = progress >= 1

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative bg-white px-5 py-5 flex flex-col"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.07)',
      }}
      whileHover={{
        boxShadow: '0 8px 28px rgba(0,0,0,0.10), 0 0 0 1px rgba(26,25,22,0.07)',
        y: -3,
      }}
    >
      {/* Archive × */}
      <button
        onClick={onArchive}
        className="absolute top-3 right-3 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-stone-600 text-base leading-none"
        aria-label="Archive habit"
      >
        ×
      </button>

      {/* Top row: ring + info */}
      <div className="flex items-start gap-4">
        <button
          onClick={done ? onRemove : onLog}
          aria-label={done ? 'Undo completion' : 'Log completion'}
          className="mt-0.5 shrink-0"
        >
          <CompletionRing progress={progress} color={habit.color} size={60} />
        </button>

        <div className="flex-1 min-w-0 pt-0.5">
          <p
            className="text-base text-stone-800 leading-snug truncate"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {habit.title}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">{FREQ_LABEL[habit.frequency]}</p>

          {/* Progress fraction */}
          <p className="text-xs text-stone-500 mt-1.5">
            <span style={{ color: habit.color, fontWeight: 500 }}>{todayCount}</span>
            <span className="text-stone-300 mx-0.5">/</span>
            {habit.target_count}
          </p>
        </div>
      </div>

      {/* 7-day strip */}
      <WeekStrip
        habitId={habit.id}
        completions={completions}
        last7={last7}
        color={habit.color}
      />

      {/* Bottom row: streak + xp */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
        <span className="text-xs text-stone-400">
          {habit.current_streak > 0 ? (
            <span className="text-stone-600">{habit.current_streak}d streak</span>
          ) : (
            <span className="text-stone-300">No streak yet</span>
          )}
        </span>
        <span
          className="text-xs px-2 py-0.5"
          style={{
            backgroundColor: `${habit.color}18`,
            color: habit.color,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
          }}
        >
          +{habit.xp_reward} xp
        </span>
      </div>
    </motion.div>
  )
}

// ─── Add habit form ─────────────────────────────────────────────────────────────

function AddHabitRow({
  onAdd,
  onCancel,
}: {
  onAdd: (data: { title: string; frequency: HabitFrequency; target_count: number; color: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [target, setTarget] = useState(1)
  const [color, setColor] = useState('#1a1916')

  const FREQ_OPTIONS: Array<{ id: HabitFrequency; label: string }> = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'custom', label: 'Custom' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      className="bg-white px-5 py-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.07)' }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) onAdd({ title, frequency, target_count: target, color })
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="New habit..."
        className="w-full text-base text-stone-800 outline-none placeholder:text-stone-300 bg-transparent mb-4"
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
      />

      {/* Frequency pills */}
      <div className="flex gap-2 mb-4">
        {FREQ_OPTIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFrequency(f.id)}
            className="px-3 py-1 text-xs transition-colors"
            style={{
              backgroundColor: frequency === f.id ? '#1a1916' : 'transparent',
              color: frequency === f.id ? '#ffffff' : '#78716c',
              border: '1px solid',
              borderColor: frequency === f.id ? '#1a1916' : 'rgba(26,25,22,0.15)',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Target + color */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">Times per day:</span>
          <button
            onClick={() => setTarget(Math.max(1, target - 1))}
            className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-800 text-lg leading-none"
          >−</button>
          <span className="text-sm text-stone-800 w-4 text-center">{target}</span>
          <button
            onClick={() => setTarget(Math.min(10, target + 1))}
            className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-800 text-lg leading-none"
          >+</button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-4 h-4 rounded-full transition-transform"
              style={{
                backgroundColor: c,
                transform: color === c ? 'scale(1.35)' : 'scale(1)',
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { if (title.trim()) onAdd({ title, frequency, target_count: target, color }) }}
          className="px-4 py-1.5 text-xs text-white"
          style={{ backgroundColor: '#1a1916', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Add habit
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Cancel
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function HabitsClient({ habits: initialHabits, completions, today }: HabitsClientProps) {
  const [, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [freqFilter, setFreqFilter] = useState<HabitFrequency | 'all'>('all')
  const [saveError, setSaveError] = useState<string | null>(null)

  const last7 = getLast7Days(today)

  const initialState: HabitsState = {
    habits: initialHabits,
    completionMap: buildCompletionMap(completions, today),
  }

  const [optimistic, addOptimistic] = useOptimistic(
    initialState,
    (state: HabitsState, action: OptimisticAction): HabitsState => {
      switch (action.type) {
        case 'log': {
          const next = new Map(state.completionMap)
          next.set(action.habitId, (next.get(action.habitId) ?? 0) + 1)
          return { ...state, completionMap: next }
        }
        case 'remove': {
          const next = new Map(state.completionMap)
          const cur = next.get(action.habitId) ?? 0
          if (cur <= 1) next.delete(action.habitId)
          else next.set(action.habitId, cur - 1)
          return { ...state, completionMap: next }
        }
        case 'add':
          return { ...state, habits: [...state.habits, action.habit] }
        case 'archive':
          return { ...state, habits: state.habits.filter((h) => h.id !== action.habitId) }
        default:
          return state
      }
    }
  )

  const handleLog = useCallback((habitId: string) => {
    startTransition(async () => {
      addOptimistic({ type: 'log', habitId })
      await logCompletion(habitId, today)
    })
  }, [today, addOptimistic])

  const handleRemove = useCallback((habitId: string) => {
    startTransition(async () => {
      addOptimistic({ type: 'remove', habitId })
      await removeCompletion(habitId, today)
    })
  }, [today, addOptimistic])

  const handleArchive = useCallback((habitId: string) => {
    startTransition(async () => {
      addOptimistic({ type: 'archive', habitId })
      await archiveHabit(habitId)
    })
  }, [addOptimistic])

  const handleAdd = useCallback((data: { title: string; frequency: HabitFrequency; target_count: number; color: string }) => {
    setShowAdd(false)
    const tempHabit: Habit = {
      id: `temp-${Date.now()}`,
      user_id: '',
      title: data.title,
      description: null,
      icon: null,
      color: data.color,
      frequency: data.frequency,
      frequency_days: null,
      target_count: data.target_count,
      xp_reward: 20,
      current_streak: 0,
      longest_streak: 0,
      is_archived: false,
      sort_order: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    startTransition(async () => {
      addOptimistic({ type: 'add', habit: tempHabit })
      const result = await createHabit(data)
      if (result?.error) setSaveError(result.error)
    })
  }, [addOptimistic, setSaveError])

  const filtered = freqFilter === 'all'
    ? optimistic.habits
    : optimistic.habits.filter((h) => h.frequency === freqFilter)

  const doneTodayCount = [...optimistic.completionMap.entries()].filter(([, c]) => c > 0).length
  const totalCount = optimistic.habits.length

  const FREQ_FILTERS: Array<{ id: HabitFrequency | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'custom', label: 'Custom' },
  ]

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] bg-white overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 py-8 pl-10 pr-6"
        style={{
          width: 260,
          borderRight: '1px solid rgba(26,25,22,0.07)',
        }}
      >
        {/* Title */}
        <h1
          className="text-4xl text-stone-900 mb-2 leading-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Habits
        </h1>

        {/* Summary */}
        <p className="text-sm text-stone-400 mb-8">
          {doneTodayCount > 0
            ? <><span className="text-stone-700">{doneTodayCount} done</span> · {totalCount - doneTodayCount} to go</>
            : <>{totalCount} habit{totalCount !== 1 ? 's' : ''} today</>
          }
        </p>

        {/* Frequency filters */}
        <div className="flex flex-col gap-1.5">
          {FREQ_FILTERS.map((f) => {
            const active = freqFilter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFreqFilter(f.id)}
                className="text-left px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: active ? '#1a1916' : 'transparent',
                  color: active ? '#ffffff' : '#78716c',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Best streak */}
        {initialHabits.length > 0 && (() => {
          const best = Math.max(...initialHabits.map((h) => h.longest_streak))
          return best > 0 ? (
            <div className="mb-4">
              <p className="text-xs text-stone-400 mb-0.5">Best streak</p>
              <p
                className="text-2xl text-stone-800"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {best}d
              </p>
            </div>
          ) : null
        })()}

        {/* Faint illustration */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/category-hobbies.png"
          alt=""
          className="w-32 opacity-20 object-contain self-center"
          draggable={false}
        />
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-10 pt-8 pb-5 shrink-0">
          <p className="text-sm text-stone-400">
            {filtered.length} habit{filtered.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors group"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            <span
              className="w-6 h-6 rounded-full border border-stone-300 group-hover:border-stone-700 flex items-center justify-center text-base leading-none transition-colors"
            >
              +
            </span>
            New habit
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <div className="px-10 mb-4 shrink-0">
              <AddHabitRow
                onAdd={handleAdd}
                onCancel={() => setShowAdd(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-10 pb-10" style={{ scrollbarWidth: 'none' }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {/* Save error */}
          <AnimatePresence>
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)', color: '#dc2626', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                <span>{saveError}</span>
                <button onClick={() => setSaveError(null)} style={{ marginLeft: 12, opacity: 0.6, fontSize: '1.1rem', lineHeight: 1 }}>×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 pb-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/chibi-tired.png"
                alt=""
                className="w-28 h-28 object-contain opacity-40"
                draggable={false}
              />
              <p
                className="text-stone-400 text-sm"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                No habits yet
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-3 gap-5"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    todayCount={optimistic.completionMap.get(habit.id) ?? 0}
                    completions={completions}
                    last7={last7}
                    onLog={() => handleLog(habit.id)}
                    onRemove={() => handleRemove(habit.id)}
                    onArchive={() => handleArchive(habit.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
