'use client'

import { useState, useOptimistic, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, TaskPriority, TaskStatus } from '@maable/core'
import { createTask, toggleTask, archiveTask } from './actions'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; label: string }> = {
  urgent: { color: '#ef4444', label: 'Urgent' },
  high:   { color: '#f97316', label: 'High'   },
  medium: { color: '#d4a843', label: 'Medium' },
  low:    { color: '#a8a29e', label: 'Low'    },
}

const XP_BY_PRIORITY: Record<TaskPriority, number> = {
  low: 10, medium: 25, high: 50, urgent: 75,
}

type ViewFilter = 'all' | 'today' | 'upcoming' | 'no-date'
type PriorityFilter = TaskPriority | 'all'

// ─── Grouping ─────────────────────────────────────────────────────────────────

function groupTasks(tasks: Task[], view: ViewFilter, priority: PriorityFilter) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayStart.getDate() + 1)
  const weekEnd    = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7)

  let list = priority === 'all' ? tasks : tasks.filter(t => t.priority === priority)

  const active = list.filter(t => t.status !== 'done')
  const done   = list
    .filter(t => t.status === 'done')
    .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime())
    .slice(0, 12)

  const dueDate = (t: Task) => t.due_date ? new Date(t.due_date) : null

  if (view === 'today') {
    return { 'Today': active.filter(t => { const d = dueDate(t); return d && d < todayEnd }) }
  }
  if (view === 'upcoming') {
    return { 'This week': active.filter(t => { const d = dueDate(t); return d && d >= todayEnd && d < weekEnd }) }
  }
  if (view === 'no-date') {
    return { 'No date': active.filter(t => !t.due_date) }
  }

  const groups: Record<string, Task[]> = {}

  const overdue  = active.filter(t => { const d = dueDate(t); return d && d < todayStart })
  const today    = active.filter(t => { const d = dueDate(t); return d && d >= todayStart && d < todayEnd })
  const thisWeek = active.filter(t => { const d = dueDate(t); return d && d >= todayEnd && d < weekEnd })
  const later    = active.filter(t => { const d = dueDate(t); return d && d >= weekEnd })
  const noDate   = active.filter(t => !t.due_date)

  const byDate = (a: Task, b: Task) =>
    new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()

  if (overdue.length)  groups['Overdue']   = overdue.sort(byDate)
  if (today.length)    groups['Today']     = today
  if (thisWeek.length) groups['This week'] = thisWeek.sort(byDate)
  if (later.length)    groups['Later']     = later.sort(byDate)
  if (noDate.length)   groups['No date']   = noDate
  if (done.length)     groups['Done']      = done

  return groups
}

// ─── Date formatting ──────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0)
  const today = new Date();      today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diff === 0)  return 'Today'
  if (diff === 1)  return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0)   return `${Math.abs(diff)}d overdue`
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const done = task.status === 'done'
  const cfg  = PRIORITY_CONFIG[task.priority]
  const overdue = task.due_date
    ? new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0)) && !done
    : false

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className="group flex items-center gap-4 py-3.5 px-1"
      style={{ borderBottom: '1px solid rgba(26,25,22,0.05)' }}
    >
      {/* Completion circle */}
      <button
        onClick={() => onToggle(task)}
        className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
        style={{
          borderColor: done ? '#1a1916' : 'rgba(26,25,22,0.25)',
          backgroundColor: done ? '#1a1916' : 'transparent',
        }}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      >
        {done && (
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <span
        className="shrink-0 w-2 h-2 rounded-full"
        style={{ backgroundColor: done ? '#d4d0ca' : cfg.color }}
      />

      {/* Title */}
      <p
        className="flex-1 text-[15px] leading-snug transition-colors"
        style={{
          color: done ? '#a8a29e' : '#1a1916',
          textDecoration: done ? 'line-through' : 'none',
          textDecorationColor: 'rgba(26,25,22,0.3)',
        }}
      >
        {task.title}
      </p>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="hidden sm:flex gap-1">
          {task.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-full text-stone-500"
              style={{ backgroundColor: 'rgba(26,25,22,0.06)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Due date + time */}
      {task.due_date && (
        <span
          className="text-xs shrink-0 flex items-center gap-1"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: overdue ? '#ef4444' : '#a8a29e' }}
        >
          {fmtDate(task.due_date)}
          {task.due_time && (
            <span style={{ opacity: 0.7 }}>· {task.due_time.slice(0, 5)}</span>
          )}
        </span>
      )}

      {/* XP badge */}
      <span className="text-[11px] text-stone-300 shrink-0 w-12 text-right">
        {task.xp_reward}xp
      </span>

      {/* Delete — hover reveal */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-stone-600"
        aria-label="Remove task"
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  )
}

// ─── Add task inline form ──────────────────────────────────────────────────────

const REPEAT_OPTIONS = [
  { id: 'none',      label: 'No repeat' },
  { id: 'daily',     label: 'Daily'     },
  { id: 'weekdays',  label: 'Weekdays'  },
  { id: 'weekly',    label: 'Weekly'    },
  { id: 'monthly',   label: 'Monthly'   },
] as const
type RepeatId = typeof REPEAT_OPTIONS[number]['id']

function AddTaskRow({
  onAdd,
  onCancel,
}: {
  onAdd: (data: { title: string; priority: TaskPriority; due_date: string | null; due_time?: string | null; repeat?: string | null }) => void
  onCancel: () => void
}) {
  const [title, setTitle]       = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate]   = useState('')
  const [dueTime, setDueTime]   = useState('')
  const [repeat, setRepeat]     = useState<RepeatId>('none')
  const [showMore, setShowMore] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { onCancel(); return }
    onAdd({
      title:    title.trim(),
      priority,
      due_date: dueDate || null,
      due_time: dueTime || null,
      repeat:   repeat !== 'none' ? repeat : null,
    })
    setTitle('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className="mb-3"
    >
      <form onSubmit={handleSubmit}>
        <div
          className="rounded-2xl px-5 py-4"
          style={{ boxShadow: '0 0 0 1.5px rgba(26,25,22,0.15), 0 4px 16px rgba(0,0,0,0.07)' }}
        >
          {/* Title */}
          <input
            ref={inputRef}
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onCancel()}
            placeholder="What needs to be done?"
            className="w-full text-[15px] text-stone-800 placeholder-stone-300 bg-transparent focus:outline-none"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          />

          {/* Row 1: priority + date + time */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {/* Priority pills */}
            <div className="flex gap-1.5">
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all"
                  style={{
                    backgroundColor: priority === p ? PRIORITY_CONFIG[p].color : 'rgba(26,25,22,0.05)',
                    color: priority === p ? '#fff' : '#78716c',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: priority === p ? 'rgba(255,255,255,0.7)' : PRIORITY_CONFIG[p].color }}
                  />
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 16, backgroundColor: 'rgba(26,25,22,0.10)' }} />

            {/* Date */}
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="text-xs text-stone-400 bg-transparent focus:outline-none cursor-pointer"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            />

            {/* Time — shown when date is set */}
            {dueDate && (
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="text-xs text-stone-400 bg-transparent focus:outline-none cursor-pointer"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              />
            )}

            <div className="flex-1" />

            {/* More / less toggle */}
            <button
              type="button"
              onClick={() => setShowMore(v => !v)}
              className="text-xs text-stone-300 hover:text-stone-500 transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {showMore ? 'less ↑' : 'more ↓'}
            </button>
          </div>

          {/* Row 2: conditionals (repeat) — expanded */}
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(26,25,22,0.06)' }}>
                  <p className="text-[10px] uppercase tracking-widest text-stone-300 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    Repeat
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {REPEAT_OPTIONS.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRepeat(r.id)}
                        className="text-xs px-2.5 py-1 rounded-full transition-all"
                        style={{
                          backgroundColor: repeat === r.id ? '#1a1916' : 'rgba(26,25,22,0.05)',
                          color: repeat === r.id ? '#fff' : '#78716c',
                          fontFamily: 'Georgia, serif',
                          fontStyle: 'italic',
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions row */}
          <div className="flex items-center justify-end gap-3 mt-3">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Add task
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}

// ─── Task group section ───────────────────────────────────────────────────────

function TaskGroup({
  label,
  tasks,
  onToggle,
  onDelete,
}: {
  label: string
  tasks: Task[]
  onToggle: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(label === 'Done')
  const isOverdue = label === 'Overdue'

  return (
    <div className="mb-7">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-3 mb-1 w-full group"
      >
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: isOverdue ? '#ef4444' : '#a8a29e' }}
        >
          {label}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: 'rgba(26,25,22,0.05)', color: '#a8a29e' }}
        >
          {tasks.length}
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(26,25,22,0.06)' }} />
        <svg
          viewBox="0 0 12 12"
          fill="none"
          className="w-3 h-3 text-stone-300 transition-transform"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{ overflow: 'hidden' }}
          >
            <AnimatePresence>
              {tasks.map(t => (
                <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function TasksSidebar({
  tasks,
  view,
  setView,
  priority,
  setPriority,
}: {
  tasks: Task[]
  view: ViewFilter
  setView: (v: ViewFilter) => void
  priority: PriorityFilter
  setPriority: (p: PriorityFilter) => void
}) {
  const active     = tasks.filter(t => t.status !== 'done').length
  const doneToday  = tasks.filter(t => {
    if (t.status !== 'done' || !t.completed_at) return false
    const d = new Date(t.completed_at); d.setHours(0, 0, 0, 0)
    const n = new Date();               n.setHours(0, 0, 0, 0)
    return d.getTime() === n.getTime()
  }).length

  const VIEWS: Array<{ id: ViewFilter; label: string }> = [
    { id: 'all',      label: 'All tasks'  },
    { id: 'today',    label: 'Today'      },
    { id: 'upcoming', label: 'Upcoming'   },
    { id: 'no-date',  label: 'No date'    },
  ]

  const PRIORITIES: Array<{ id: PriorityFilter; label: string }> = [
    { id: 'all',    label: 'All'    },
    { id: 'urgent', label: 'Urgent' },
    { id: 'high',   label: 'High'   },
    { id: 'medium', label: 'Medium' },
    { id: 'low',    label: 'Low'    },
  ]

  return (
    <div
      className="flex flex-col h-full py-10 px-7 shrink-0"
      style={{ width: '260px', borderRight: '1px solid rgba(26,25,22,0.07)' }}
    >
      {/* Heading */}
      <h1
        className="text-4xl text-stone-900 leading-none mb-1"
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
      >
        Tasks
      </h1>
      <p className="text-sm text-stone-400 mb-10">
        {active} active · {doneToday} done today
      </p>

      {/* View filter */}
      <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2.5">View</p>
      <div className="space-y-0.5 mb-8">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              backgroundColor: view === v.id ? '#1a1916' : 'transparent',
              color: view === v.id ? '#ffffff' : '#78716c',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Priority filter */}
      <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2.5">Priority</p>
      <div className="space-y-0.5">
        {PRIORITIES.map(p => (
          <button
            key={p.id}
            onClick={() => setPriority(p.id)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2.5 transition-colors"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              backgroundColor: priority === p.id ? '#1a1916' : 'transparent',
              color: priority === p.id ? '#ffffff' : '#78716c',
            }}
          >
            {p.id !== 'all' && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: priority === p.id ? 'rgba(255,255,255,0.6)' : PRIORITY_CONFIG[p.id as TaskPriority].color }}
              />
            )}
            {p.label}
          </button>
        ))}
      </div>

      {/* Illustration */}
      <div className="mt-auto flex justify-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/icon-angel.png"
          alt=""
          className="w-20 h-20 object-contain"
          style={{ opacity: 0.18 }}
          draggable={false}
        />
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full pb-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/chibi-tired.png"
        alt=""
        className="w-32 h-32 object-contain mb-6"
        style={{ opacity: 0.55 }}
        draggable={false}
      />
      <p className="text-lg text-stone-400 mb-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        Nothing here yet
      </p>
      <p className="text-sm text-stone-300 mb-6">Add your first task to get started</p>
      <button
        onClick={onAdd}
        className="text-sm px-5 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-700 transition-colors"
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
      >
        + Add task
      </button>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

type OptimisticAction =
  | { type: 'toggle'; id: string; status: TaskStatus }
  | { type: 'add'; task: Task }
  | { type: 'delete'; id: string }

export function TasksClient({ tasks }: { tasks: Task[] }) {
  const [view, setView]         = useState<ViewFilter>('all')
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const [showAdd, setShowAdd]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [, startTransition]     = useTransition()

  const [optimistic, dispatch] = useOptimistic(
    tasks,
    (state: Task[], action: OptimisticAction): Task[] => {
      switch (action.type) {
        case 'toggle':
          return state.map(t =>
            t.id === action.id
              ? { ...t, status: action.status, completed_at: action.status === 'done' ? new Date().toISOString() : null }
              : t
          )
        case 'add':
          return [action.task, ...state]
        case 'delete':
          return state.filter(t => t.id !== action.id)
      }
    }
  )

  function handleToggle(task: Task) {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    startTransition(() => {
      dispatch({ type: 'toggle', id: task.id, status: newStatus })
      toggleTask(task.id, task.status)
    })
  }

  function handleDelete(id: string) {
    startTransition(() => {
      dispatch({ type: 'delete', id })
      archiveTask(id)
    })
  }

  function handleAdd(data: { title: string; priority: TaskPriority; due_date: string | null; due_time?: string | null; repeat?: string | null }) {
    const optimisticTask: Task = {
      id: `opt-${Date.now()}`,
      user_id: '',
      project_id: null,
      parent_task_id: null,
      title: data.title,
      description: null,
      status: 'todo',
      priority: data.priority,
      due_date: data.due_date,
      due_time: data.due_time ?? null,
      reminder_at: null,
      tags: [],
      xp_reward: XP_BY_PRIORITY[data.priority],
      sort_order: Date.now(),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setShowAdd(false)
    startTransition(async () => {
      dispatch({ type: 'add', task: optimisticTask })
      const result = await createTask(data)
      if (result?.error) setSaveError(result.error)
    })
  }

  const groups = groupTasks(optimistic, view, priority)
  const isEmpty = Object.values(groups).every(g => g.length === 0)

  return (
    <div className="flex" style={{ height: 'calc(100dvh - 4.5rem)', backgroundColor: '#ffffff' }}>

      {/* Sidebar */}
      <TasksSidebar
        tasks={optimistic}
        view={view}
        setView={setView}
        priority={priority}
        setPriority={setPriority}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-10 py-6 shrink-0"
          style={{ borderBottom: '1px solid rgba(26,25,22,0.06)' }}
        >
          <p
            className="text-stone-400 text-sm"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {isEmpty ? 'Your task list is clear' : `${Object.values(groups).reduce((s, g) => s + g.length, 0)} tasks`}
          </p>
          <motion.button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white transition-colors"
            style={{ backgroundColor: '#1a1916', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            whileHover={{ backgroundColor: '#2d2b28' }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-lg leading-none">+</span>
            New task
          </motion.button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-10 pt-8 pb-10" style={{ scrollbarWidth: 'none' }}>
          <style>{`.task-scroll::-webkit-scrollbar{display:none}`}</style>

          {/* Save error banner */}
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

          {/* Inline add form */}
          <AnimatePresence>
            {showAdd && (
              <AddTaskRow
                key="add-form"
                onAdd={handleAdd}
                onCancel={() => setShowAdd(false)}
              />
            )}
          </AnimatePresence>

          {isEmpty ? (
            <EmptyState onAdd={() => setShowAdd(true)} />
          ) : (
            <AnimatePresence>
              {Object.entries(groups).map(([label, groupTasks]) =>
                groupTasks.length > 0 ? (
                  <TaskGroup
                    key={label}
                    label={label}
                    tasks={groupTasks}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ) : null
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
