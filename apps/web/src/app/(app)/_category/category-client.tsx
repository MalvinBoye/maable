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
  integrationId?: string
  integrationName?: string
  integrationColor?: string
  integrationHint?: string
  tips?: string[]
  quickLinks?: Array<{ label: string; href: string; icon: string; description?: string }>
}

// ─── Priority colours ─────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#d4a843',
  low:    '#a8a29e',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
}

const XP_BY_PRIORITY: Record<TaskPriority, number> = {
  urgent: 75, high: 50, medium: 25, low: 10,
}

// ─── Quick-access shortcut cards ─────────────────────────────────────────────

function QuickAccess({ links, integrationId, integrationName, integrationColor, integrationHint }: {
  links?: CategoryConfig['quickLinks']
  integrationId?: string
  integrationName?: string
  integrationColor?: string
  integrationHint?: string
}) {
  const [intConnected] = useState(() => {
    if (typeof window === 'undefined' || !integrationId) return false
    try {
      const c = JSON.parse(localStorage.getItem('maable-connections') ?? '{}') as Record<string, unknown>
      return !!c[integrationId]
    } catch { return false }
  })

  const hasLinks = links && links.length > 0
  const hasIntegration = !!(integrationId && integrationName && integrationColor && integrationHint)

  if (!hasLinks && !hasIntegration) return null

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{
        fontSize: '0.55rem', letterSpacing: '0.20em', textTransform: 'uppercase',
        color: 'rgba(26,25,22,0.32)', fontFamily: 'Georgia, serif',
        marginBottom: 12,
      }}>
        Quick access
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 10 }}>
        {/* Quick links as cards */}
        {links?.map((link) => (
          <Link key={`${link.href}-${link.label}`} href={link.href} style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(26,25,22,0.08)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                padding: '14px 14px 12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.06)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '0.85rem', display: 'block', marginBottom: 8, color: '#c9a84c' }}>
                {link.icon}
              </span>
              <p style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '0.80rem', color: '#1a1916', marginBottom: 2, lineHeight: 1.2,
              }}>
                {link.label}
              </p>
              {link.description && (
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'rgba(26,25,22,0.38)', lineHeight: 1.4 }}>
                  {link.description}
                </p>
              )}
            </motion.div>
          </Link>
        ))}

        {/* Integration card */}
        {hasIntegration && (
          <Link href="/connect" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(26,25,22,0.08)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                padding: '14px 14px 12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.06)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Connected indicator stripe */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                backgroundColor: integrationColor,
                opacity: intConnected ? 1 : 0.22,
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: integrationColor, opacity: intConnected ? 1 : 0.35, flexShrink: 0 }} />
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.80rem', color: '#1a1916', lineHeight: 1.2 }}>
                  {integrationName}
                </p>
              </div>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'rgba(26,25,22,0.38)', lineHeight: 1.4 }}>
                {intConnected ? 'Connected · manage' : integrationHint}
              </p>
            </motion.div>
          </Link>
        )}
      </div>
    </div>
  )
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
        fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round"
        strokeDasharray={`${circ}`}
        animate={{ strokeDashoffset: done ? 0 : circ }}
        initial={false}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        style={{ rotate: '-90deg', transformOrigin: '50% 50%' }}
      />
    </svg>
  )
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onArchive }: { task: Task; onToggle: () => void; onArchive: () => void }) {
  const done = task.status === 'done'
  const overdue = task.due_date && !done && new Date(task.due_date) < new Date(new Date().toDateString())

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -14, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="group flex items-center gap-3"
      style={{
        backgroundColor: '#fff',
        borderRadius: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.06)',
        borderLeft: `3.5px solid ${done ? 'rgba(26,25,22,0.10)' : PRIORITY_COLOR[task.priority]}`,
        padding: '13px 14px 13px 16px',
        marginBottom: 8,
      }}
      whileHover={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(26,25,22,0.08)' }}
    >
      <button onClick={onToggle} className="shrink-0">
        <Ring done={done} color={PRIORITY_COLOR[task.priority]} />
      </button>

      <p
        className="flex-1 text-sm leading-snug"
        style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          color: done ? '#a8a29e' : '#292524',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </p>

      <div className="flex items-center gap-2 shrink-0">
        {task.due_date && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            backgroundColor: overdue ? 'rgba(239,68,68,0.08)' : 'rgba(26,25,22,0.04)',
            color: overdue ? '#ef4444' : '#a8a29e',
          }}>
            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        <span className="text-xs px-2 py-0.5 rounded-full" style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          backgroundColor: `${PRIORITY_COLOR[task.priority]}14`,
          color: PRIORITY_COLOR[task.priority],
        }}>
          +{task.xp_reward}
        </span>
        <button
          onClick={onArchive}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-stone-600 text-base leading-none"
        >
          ×
        </button>
      </div>
    </motion.div>
  )
}

// ─── Progress card ────────────────────────────────────────────────────────────

function ProgressCard({ total, doneCount }: { total: number; doneCount: number }) {
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const remaining = total - doneCount
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(26,25,22,0.45)' }}>
          {remaining === 0 ? 'All done — nice work' : `${remaining} remaining`}
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.80rem', color: pct === 100 ? '#c9a84c' : 'rgba(26,25,22,0.32)' }}>
          {pct}%
        </p>
      </div>
      <div style={{ height: 3, backgroundColor: 'rgba(26,25,22,0.07)', borderRadius: 6, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.34, 1.2, 0.64, 1] }}
          style={{ height: '100%', backgroundColor: '#c9a84c', borderRadius: 6 }}
        />
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ config, onAdd }: { config: CategoryConfig; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 60, gap: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/illustrations/category-${config.illustration}.png`}
        alt="" draggable={false}
        style={{ width: 180, height: 180, objectFit: 'contain', opacity: 0.45, marginBottom: 24 }}
      />
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.25rem', color: '#292524', marginBottom: 8, textAlign: 'center' }}>
        {config.emptyLine1}
      </p>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(26,25,22,0.38)', marginBottom: 28, textAlign: 'center' }}>
        {config.emptyLine2}
      </p>
      <motion.button
        onClick={onAdd}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          backgroundColor: '#1a1916', color: 'rgba(255,255,255,0.80)',
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: '0.82rem', padding: '10px 22px',
          borderRadius: 8, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ color: '#c9a84c', fontSize: '1rem', lineHeight: 1 }}>+</span>
        Add first {config.taskLabel}
        <span style={{ fontSize: 9, color: '#c9a84c', backgroundColor: 'rgba(201,168,76,0.14)', borderRadius: 10, padding: '2px 7px' }}>
          +25 xp
        </span>
      </motion.button>
    </motion.div>
  )
}

// ─── Add form ─────────────────────────────────────────────────────────────────

function AddForm({ taskLabel, onAdd, onCancel }: {
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
        backgroundColor: '#131210', border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 10, overflow: 'hidden', position: 'relative', marginBottom: 16,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(201,168,76,0.30)' }} />

      <div style={{ position: 'relative', padding: '18px 20px 16px' }}>
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: '0.52rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.50)', fontFamily: 'Georgia, serif' }}>
            new {taskLabel}
          </p>
          <motion.div
            key={priority}
            initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 24 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              backgroundColor: `${PRIORITY_COLOR[priority]}18`, border: `1px solid ${PRIORITY_COLOR[priority]}40`,
              borderRadius: 20, padding: '3px 10px',
            }}
          >
            <span style={{ fontSize: 10, color: PRIORITY_COLOR[priority], fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>+{xp} XP</span>
            <span style={{ fontSize: 9, color: `${PRIORITY_COLOR[priority]}90`, fontFamily: 'Georgia, serif' }}>{PRIORITY_LABEL[priority]}</span>
          </motion.div>
        </div>

        <input
          autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel() }}
          placeholder={`What's the ${taskLabel}?`}
          style={{
            width: '100%', fontSize: 15, outline: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.88)', fontFamily: 'Georgia, serif', fontStyle: 'italic',
            borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10, marginBottom: 14,
          }}
        />

        <div className="flex items-center gap-5">
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((p) => (
              <button key={p} title={PRIORITY_LABEL[p]} onClick={() => setPriority(p)} style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${PRIORITY_COLOR[p]}`,
                backgroundColor: priority === p ? PRIORITY_COLOR[p] : 'transparent',
                transform: priority === p ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform 0.12s, background-color 0.12s', cursor: 'pointer',
              }} />
            ))}
          </div>
          <input
            type="date" value={due} onChange={(e) => setDue(e.target.value)}
            style={{ fontSize: 11, outline: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }} />
          <button onClick={onCancel} style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>cancel</button>
          <button onClick={submit} style={{
            fontSize: 12, color: '#0a0908', fontFamily: 'Georgia, serif', fontStyle: 'italic',
            backgroundColor: title.trim() ? '#c9a84c' : 'rgba(201,168,76,0.30)',
            padding: '5px 14px', borderRadius: 4, cursor: title.trim() ? 'pointer' : 'default',
            transition: 'background-color 0.15s',
          }}>
            Add {taskLabel}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Optimistic reducer ───────────────────────────────────────────────────────

type OptAction =
  | { type: 'toggle'; id: string }
  | { type: 'add'; task: Task }
  | { type: 'archive'; id: string }

function reducer(tasks: Task[], action: OptAction): Task[] {
  switch (action.type) {
    case 'toggle':
      return tasks.map((t) => t.id === action.id ? { ...t, status: (t.status === 'done' ? 'todo' : 'done') as TaskStatus } : t)
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
      user_id: '', project_id: null, parent_task_id: null,
      title: data.title, description: null, status: 'todo',
      priority: data.priority, due_date: data.due_date, due_time: null, reminder_at: null,
      tags: [config.tag],
      xp_reward: xpReward[data.priority],
      sort_order: Math.floor(Date.now() / 1000),
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
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden" style={{ backgroundColor: '#f4f2ee' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 py-8 pl-10 pr-6 overflow-y-auto"
        style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.08)', backgroundColor: '#fff', scrollbarWidth: 'none' }}
      >
        {/* Hero illustration */}
        <div className="flex items-end justify-center mb-6 shrink-0" style={{ minHeight: 180 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/illustrations/category-${config.illustration}.png`}
            alt={config.title} draggable={false}
            style={{ width: '88%', maxHeight: 200, objectFit: 'contain' }}
          />
        </div>

        {/* Title + tagline */}
        <h1 className="text-4xl text-stone-900 leading-none mb-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {config.title}
        </h1>
        <p className="text-xs text-stone-400 mb-6" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {config.tagline}
        </p>

        {/* Stats pills */}
        <div className="flex gap-3 mb-6">
          {[{ n: active.length, label: 'active' }, { n: done.length, label: 'done' }].map(({ n, label }) => (
            <div key={label} style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              backgroundColor: 'rgba(26,25,22,0.03)', borderRadius: 8, border: '1px solid rgba(26,25,22,0.06)',
            }}>
              <p className="text-2xl leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1a1916' }}>{n}</p>
              <p className="text-[10px] text-stone-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* XP Bar */}
        {xpData && <div className="mb-6"><XpBar level={xpData.level} xp={xpData.xp} compact /></div>}

        {/* Add button */}
        <motion.button
          onClick={() => setShowAdd(true)}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 self-start"
          style={{ backgroundColor: '#1a1916', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 14px' }}
        >
          <span style={{ fontSize: 16, color: '#c9a84c', lineHeight: 1 }}>+</span>
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>
            New {config.taskLabel}
          </span>
          <span style={{ fontSize: 9, color: '#c9a84c', fontFamily: 'Georgia, serif', backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 10, padding: '2px 7px', marginLeft: 2 }}>
            +25 xp
          </span>
        </motion.button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative' }}>

        {/* Dot texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(26,25,22,0.04) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }} />

        {/* XP Toast */}
        <AnimatePresence>
          {xpToast && (
            <motion.div
              key={xpToast.id}
              initial={{ opacity: 0, y: 32, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              style={{
                position: 'absolute', bottom: 32, right: 40, zIndex: 50,
                backgroundColor: '#131210', border: '1px solid rgba(201,168,76,0.35)',
                borderRadius: 8, padding: '10px 18px',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              <span style={{ fontSize: 13, color: '#c9a84c', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>+{xpToast.xp} XP</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontFamily: 'Georgia, serif' }}>added</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header row */}
        <div className="flex items-center justify-between shrink-0" style={{ padding: '28px 40px 16px', position: 'relative', zIndex: 1 }}>
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.05rem', color: '#1a1916', marginBottom: 2 }}>
              {config.taskLabel.charAt(0).toUpperCase() + config.taskLabel.slice(1)}s
            </h2>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.68rem', color: 'rgba(26,25,22,0.38)' }}>
              {active.length} active · {done.length} completed
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(26,25,22,0.45)', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#1a1916' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(26,25,22,0.45)' }}
          >
            <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(26,25,22,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', lineHeight: 1 }}>+</span>
            New {config.taskLabel}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '0 40px 40px', position: 'relative', zIndex: 1, scrollbarWidth: 'none' }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {/* Quick-access shortcut cards — always visible at top */}
          <QuickAccess
            links={config.quickLinks}
            {...(config.integrationId    ? { integrationId:    config.integrationId }    : {})}
            {...(config.integrationName  ? { integrationName:  config.integrationName }  : {})}
            {...(config.integrationColor ? { integrationColor: config.integrationColor } : {})}
            {...(config.integrationHint  ? { integrationHint:  config.integrationHint }  : {})}
          />

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

          {/* Add form */}
          <AnimatePresence>
            {showAdd && <AddForm taskLabel={config.taskLabel} onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}
          </AnimatePresence>

          {/* Task section label */}
          {(tasks.length > 0 || showAdd) && (
            <p style={{ fontSize: '0.55rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.32)', fontFamily: 'Georgia, serif', marginBottom: 12 }}>
              {config.taskLabel}s
            </p>
          )}

          {tasks.length === 0 && !showAdd ? (
            <EmptyState config={config} onAdd={() => setShowAdd(true)} />
          ) : tasks.length > 0 ? (
            <motion.div layout>
              <ProgressCard total={tasks.length} doneCount={done.length} />

              <AnimatePresence mode="popLayout">
                {active.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={() => handleToggle(task)} onArchive={() => handleArchive(task.id)} />
                ))}
              </AnimatePresence>

              {done.length > 0 && (
                <div className="mt-8">
                  <p style={{ fontSize: '0.55rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.28)', marginBottom: 10, paddingLeft: 2, fontFamily: 'Georgia, serif' }}>
                    Completed · {done.length}
                  </p>
                  <AnimatePresence mode="popLayout">
                    {done.map((task) => (
                      <TaskCard key={task.id} task={task} onToggle={() => handleToggle(task)} onArchive={() => handleArchive(task.id)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
