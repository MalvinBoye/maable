'use client'

import { useState, useOptimistic, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { Task, TaskPriority, TaskStatus } from '@maable/core'
import { createTask, toggleTask, archiveTask } from '@/app/(app)/tasks/actions'
import { XpBar } from '@/components/app/xp-bar'

// ─── Config ───────────────────────────────────────────────────────────────────

export interface CategoryConfig {
  tag: string
  title: string
  tagline: string
  illustration: string
  taskLabel: string
  emptyLine1: string
  emptyLine2: string
  // Enrichment
  integrationId?: string       // id in connect-client INTEGRATIONS
  integrationName?: string
  integrationColor?: string
  integrationHint?: string
  tips?: string[]              // short power-user tips shown in sidebar
  quickLinks?: Array<{ label: string; href: string; icon: string }>
}

// ─── Integration banner ───────────────────────────────────────────────────────

function IntegrationBanner({
  id, name, color, hint,
}: { id: string; name: string; color: string; hint: string }) {
  const [connected] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const conns = JSON.parse(localStorage.getItem('maable-connections') ?? '{}') as Record<string, unknown>
      return !!conns[id]
    } catch { return false }
  })

  if (connected) {
    return (
      <div
        className="px-4 py-3 rounded-xl mb-5"
        style={{ backgroundColor: `${color}10`, border: `1px solid ${color}28` }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-xs" style={{ color, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {name} connected
          </p>
        </div>
        <Link
          href="/connect"
          className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Manage →
        </Link>
      </div>
    )
  }

  return (
    <div
      className="px-4 py-3 rounded-xl mb-5"
      style={{ border: '1px solid rgba(26,25,22,0.08)', backgroundColor: 'rgba(26,25,22,0.02)' }}
    >
      <p className="text-xs text-stone-500 mb-1 leading-snug" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        {hint}
      </p>
      <Link
        href="/connect"
        className="text-xs transition-colors"
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color }}
      >
        Connect {name} →
      </Link>
    </div>
  )
}

// ─── Priority colours ─────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#d4a843',
  low:    '#a8a29e',
}

// ─── Completion ring ──────────────────────────────────────────────────────────

function Ring({ done, color }: { done: boolean; color: string }) {
  const r = 9
  const circ = 2 * Math.PI * r
  return (
    <svg width={24} height={24} className="shrink-0">
      <circle cx={12} cy={12} r={r} fill="none" stroke="rgba(26,25,22,0.12)" strokeWidth={1.5} />
      <motion.circle
        cx={12} cy={12} r={r}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        animate={{ strokeDashoffset: done ? 0 : circ }}
        initial={false}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        style={{ rotate: '-90deg', transformOrigin: '50% 50%' }}
      />
    </svg>
  )
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onArchive,
}: {
  task: Task
  onToggle: () => void
  onArchive: () => void
}) {
  const done = task.status === 'done'
  const overdue =
    task.due_date && !done && new Date(task.due_date) < new Date(new Date().toDateString())

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="group flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: '1px solid rgba(26,25,22,0.05)' }}
    >
      <button onClick={onToggle} className="shrink-0">
        <Ring done={done} color={PRIORITY_COLOR[task.priority]} />
      </button>

      {/* Priority dot */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
      />

      {/* Title */}
      <p
        className="flex-1 text-sm leading-snug"
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          color: done ? '#a8a29e' : '#292524',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </p>

      {/* Due date */}
      {task.due_date && (
        <span
          className="text-xs shrink-0"
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: overdue ? '#ef4444' : '#a8a29e',
          }}
        >
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* XP */}
      <span
        className="text-xs px-1.5 py-0.5 shrink-0"
        style={{
          backgroundColor: `${PRIORITY_COLOR[task.priority]}18`,
          color: PRIORITY_COLOR[task.priority],
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
        }}
      >
        +{task.xp_reward}
      </span>

      {/* Archive × */}
      <button
        onClick={onArchive}
        className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-stone-600 text-base leading-none shrink-0"
      >
        ×
      </button>
    </motion.div>
  )
}

// ─── XP lookup ────────────────────────────────────────────────────────────────

const XP_BY_PRIORITY: Record<TaskPriority, number> = {
  urgent: 75, high: 50, medium: 25, low: 10,
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
}

// ─── Add form ─────────────────────────────────────────────────────────────────

function AddForm({
  taskLabel,
  onAdd,
  onCancel,
}: {
  taskLabel: string
  onAdd: (data: { title: string; priority: TaskPriority; due_date: string | null }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [due, setDue] = useState('')

  const PRIORITY_OPTIONS: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
  const xp = XP_BY_PRIORITY[priority]

  function submit() {
    if (!title.trim()) return
    onAdd({ title: title.trim(), priority, due_date: due || null })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{
        backgroundColor: '#131210',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }} />
      {/* Gold top rule */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(201,168,76,0.30)' }} />

      <div style={{ position: 'relative', padding: '18px 20px 16px' }}>
        {/* XP badge */}
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: '0.52rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.50)', fontFamily: 'Georgia, serif' }}>
            new {taskLabel}
          </p>
          <motion.div
            key={priority}
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 24 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              backgroundColor: `${PRIORITY_COLOR[priority]}18`,
              border: `1px solid ${PRIORITY_COLOR[priority]}40`,
              borderRadius: 20, padding: '3px 10px',
            }}
          >
            <span style={{ fontSize: 10, color: PRIORITY_COLOR[priority], fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              +{xp} XP
            </span>
            <span style={{ fontSize: 9, color: `${PRIORITY_COLOR[priority]}90`, fontFamily: 'Georgia, serif' }}>
              {PRIORITY_LABEL[priority]}
            </span>
          </motion.div>
        </div>

        {/* Title input */}
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') onCancel()
          }}
          placeholder={`What's the ${taskLabel}?`}
          style={{
            width: '100%', fontSize: 15, outline: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.88)', fontFamily: 'Georgia, serif', fontStyle: 'italic',
            borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10, marginBottom: 14,
          }}
        />

        {/* Priority + date row */}
        <div className="flex items-center gap-5">
          {/* Priority dots */}
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                title={PRIORITY_LABEL[p]}
                onClick={() => setPriority(p)}
                style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${PRIORITY_COLOR[p]}`,
                  backgroundColor: priority === p ? PRIORITY_COLOR[p] : 'transparent',
                  transform: priority === p ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.12s, background-color 0.12s',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* Date */}
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            style={{
              fontSize: 11, outline: 'none', background: 'transparent',
              color: 'rgba(255,255,255,0.35)', fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer',
            }}
          />

          <div style={{ flex: 1 }} />

          {/* Actions */}
          <button
            onClick={onCancel}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}
          >
            cancel
          </button>
          <button
            onClick={submit}
            style={{
              fontSize: 12, color: '#0a0908', fontFamily: 'Georgia, serif', fontStyle: 'italic',
              backgroundColor: title.trim() ? '#c9a84c' : 'rgba(201,168,76,0.30)',
              padding: '5px 14px', borderRadius: 4, cursor: title.trim() ? 'pointer' : 'default',
              transition: 'background-color 0.15s',
            }}
          >
            Add {taskLabel}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Optimistic state ─────────────────────────────────────────────────────────

type OptAction =
  | { type: 'toggle'; id: string }
  | { type: 'add'; task: Task }
  | { type: 'archive'; id: string }

function reducer(tasks: Task[], action: OptAction): Task[] {
  switch (action.type) {
    case 'toggle':
      return tasks.map((t) =>
        t.id === action.id
          ? { ...t, status: (t.status === 'done' ? 'todo' : 'done') as TaskStatus }
          : t
      )
    case 'add':
      return [action.task, ...tasks]
    case 'archive':
      return tasks.filter((t) => t.id !== action.id)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CategoryClient({
  config,
  tasks: initialTasks,
  xpData,
}: {
  config: CategoryConfig
  tasks: Task[]
  xpData?: { level: number; xp: number } | null
}) {
  const [, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [xpToast, setXpToast] = useState<{ xp: number; id: number } | null>(null)

  const [tasks, addOptimistic] = useOptimistic(initialTasks, reducer)

  const active = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')

  const handleToggle = useCallback((task: Task) => {
    startTransition(async () => {
      addOptimistic({ type: 'toggle', id: task.id })
      await toggleTask(task.id, task.status)
    })
  }, [addOptimistic])

  const handleArchive = useCallback((id: string) => {
    startTransition(async () => {
      addOptimistic({ type: 'archive', id })
      await archiveTask(id)
    })
  }, [addOptimistic])

  const handleAdd = useCallback((data: { title: string; priority: TaskPriority; due_date: string | null }) => {
    setShowAdd(false)
    const xpReward: Record<TaskPriority, number> = { urgent: 75, high: 50, medium: 25, low: 10 }
    const temp: Task = {
      id: `temp-${Date.now()}`,
      user_id: '',
      project_id: null,
      parent_task_id: null,
      title: data.title,
      description: null,
      status: 'todo',
      priority: data.priority,
      due_date: data.due_date,
      due_time: null,
      reminder_at: null,
      tags: [config.tag],
      xp_reward: xpReward[data.priority],
      sort_order: Date.now(),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    startTransition(async () => {
      addOptimistic({ type: 'add', task: temp })
      const result = await createTask({ ...data, tags: [config.tag] })
      if (result?.error) {
        setSaveError(result.error)
      } else {
        const id = Date.now()
        setXpToast({ xp: xpReward[data.priority], id })
        setTimeout(() => setXpToast((t) => t?.id === id ? null : t), 2200)
      }
    })
  }, [config.tag, addOptimistic])

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] bg-white overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 py-8 pl-10 pr-6"
        style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)' }}
      >
        {/* Illustration — hero for this category */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/illustrations/category-${config.illustration}.png`}
            alt={config.title}
            className="w-full max-h-56 object-contain"
            draggable={false}
          />
        </div>

        {/* Title + tagline */}
        <h1
          className="text-4xl text-stone-900 mt-4 leading-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          {config.title}
        </h1>
        <p className="text-sm text-stone-400 mt-1 mb-6">{config.tagline}</p>

        {/* Stats */}
        <div className="flex gap-6 mb-6">
          <div>
            <p className="text-2xl text-stone-800 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {active.length}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">active</p>
          </div>
          <div>
            <p className="text-2xl text-stone-800 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {done.length}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">done</p>
          </div>
        </div>

        {/* Integration banner */}
        {config.integrationId && config.integrationName && config.integrationColor && config.integrationHint && (
          <IntegrationBanner
            id={config.integrationId}
            name={config.integrationName}
            color={config.integrationColor}
            hint={config.integrationHint}
          />
        )}

        {/* Study notes card — charcoal notebook with architecture grid */}
        {((config.quickLinks && config.quickLinks.length > 0) || (config.tips && config.tips.length > 0)) && (
          <div
            className="mb-5 relative overflow-hidden"
            style={{
              backgroundColor: '#1e1c19',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 4,
              padding: '14px 14px 12px',
            }}
          >
            {/* Architecture dot-grid */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }} />
            {/* Top gold rule */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(201,168,76,0.25)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '0.52rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', fontFamily: 'Georgia, serif', marginBottom: 10 }}>
                study notes
              </p>

              {/* Quick links */}
              {config.quickLinks && config.quickLinks.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-3">
                  {config.quickLinks.map(link => (
                    <Link
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      className="flex items-center gap-2.5 py-0.5 transition-all group"
                      style={{ textDecoration: 'none' }}
                    >
                      <span style={{ fontSize: '0.45rem', color: '#c9a84c', flexShrink: 0 }}>◆</span>
                      <span style={{
                        fontFamily: 'Georgia, serif', fontStyle: 'italic',
                        fontSize: '0.75rem', color: 'rgba(255,255,255,0.58)',
                        transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.88)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.58)' }}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Divider between links and tips */}
              {config.quickLinks && config.quickLinks.length > 0 && config.tips && config.tips.length > 0 && (
                <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
              )}

              {/* Tips — pencil notes style */}
              {config.tips && config.tips.length > 0 && (
                <div className="flex flex-col gap-2">
                  {config.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.22)', marginTop: 3, flexShrink: 0, fontFamily: 'Georgia, serif' }}>·</span>
                      <p style={{
                        fontFamily: 'Georgia, serif', fontStyle: 'italic',
                        fontSize: '0.68rem', color: 'rgba(255,255,255,0.42)',
                        lineHeight: 1.55,
                      }}>
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* XP Bar */}
        {xpData && (
          <div className="mb-5">
            <XpBar level={xpData.level} xp={xpData.xp} compact />
          </div>
        )}

        {/* Add button */}
        <motion.button
          onClick={() => setShowAdd(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 self-start transition-colors group"
          style={{
            backgroundColor: '#1a1916', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '9px 14px',
          }}
        >
          <span style={{ fontSize: 16, color: '#c9a84c', lineHeight: 1 }}>+</span>
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>
            New {config.taskLabel}
          </span>
          <span style={{
            fontSize: 9, color: '#c9a84c', fontFamily: 'Georgia, serif',
            backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 10,
            padding: '2px 7px', marginLeft: 2,
          }}>
            +25 xp
          </span>
        </motion.button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative' }}>

        {/* XP Toast */}
        <AnimatePresence>
          {xpToast && (
            <motion.div
              key={xpToast.id}
              initial={{ opacity: 0, y: 32, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              style={{
                position: 'absolute', bottom: 32, right: 40, zIndex: 50,
                backgroundColor: '#131210', border: '1px solid rgba(201,168,76,0.35)',
                borderRadius: 8, padding: '10px 18px',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              <span style={{ fontSize: 13, color: '#c9a84c', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                +{xpToast.xp} XP
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontFamily: 'Georgia, serif' }}>
                added
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar */}
        <div className="flex items-center justify-between px-10 pt-8 pb-5 shrink-0">
          <p className="text-sm text-stone-400">
            {tasks.length} {config.taskLabel}{tasks.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors group"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            <span className="w-6 h-6 rounded-full border border-stone-300 group-hover:border-stone-700 flex items-center justify-center text-base leading-none transition-colors">
              +
            </span>
            New {config.taskLabel}
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <div className="px-10 mb-2 shrink-0">
              <AddForm
                taskLabel={config.taskLabel}
                onAdd={handleAdd}
                onCancel={() => setShowAdd(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* List */}
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

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 pb-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/chibi-tired.png"
                alt=""
                className="w-24 h-24 object-contain opacity-35"
                draggable={false}
              />
              <p
                className="text-stone-400 text-sm"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {config.emptyLine1}
              </p>
              <p className="text-stone-300 text-xs">{config.emptyLine2}</p>
            </div>
          ) : (
            <motion.div layout>
              {/* Active */}
              <AnimatePresence mode="popLayout">
                {active.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggle(task)}
                    onArchive={() => handleArchive(task.id)}
                  />
                ))}
              </AnimatePresence>

              {/* Done section */}
              {done.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-stone-300 tracking-widest uppercase mb-2 px-4">
                    Done · {done.length}
                  </p>
                  <AnimatePresence mode="popLayout">
                    {done.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => handleToggle(task)}
                        onArchive={() => handleArchive(task.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
