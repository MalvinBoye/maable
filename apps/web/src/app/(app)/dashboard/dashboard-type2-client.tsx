'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { Profile } from '@maable/core'
import { createClient } from '@/lib/supabase/client'
import { toggleTask, createTask } from '@/app/(app)/tasks/actions'
import { logCompletion } from '@/app/(app)/habits/actions'
import { QuickNoteModal, QuickTimerModal } from '@/components/app/quick-actions'

type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
type TaskStatus   = 'todo' | 'in_progress' | 'done'

interface T2Task {
  id: string
  title: string
  priority: TaskPriority
  xp_reward: number
  status: TaskStatus
  due_date: string | null
}

interface T2Habit {
  id: string
  title: string
  xp_reward: number
  current_streak: number
  completedToday: boolean
}

const P_COLOR: Record<string, string> = {
  urgent: '#dc2626', high: '#ea7b1a', medium: '#3b82f6', low: '#22c55e',
}

const P_LABEL: Record<string, string> = {
  urgent: 'urgent', high: 'high', medium: 'medium', low: 'low',
}

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

// ─── XP float ─────────────────────────────────────────────────────────────────

function XPFloat({ xp, onDone }: { xp: number; onDone: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -30, scale: 0.9 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{
        position: 'absolute', right: 40, top: 8, pointerEvents: 'none',
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize: '0.78rem', color: '#c9a84c', whiteSpace: 'nowrap',
        zIndex: 10,
      }}
    >
      +{xp} xp
    </motion.span>
  )
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onComplete }: { task: T2Task; onComplete: (id: string) => void }) {
  const [done, setDone] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [, startTransition] = useTransition()
  const accent = P_COLOR[task.priority] ?? '#888'

  const handle = () => {
    if (done) return
    setDone(true)
    setShowXP(true)
    startTransition(async () => {
      await toggleTask(task.id, 'todo')
      onComplete(task.id)
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: done ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { delay: 0.4 } }}
      style={{
        position: 'relative',
        background: '#ffffff',
        borderRadius: 10,
        borderLeft: `3.5px solid ${done ? 'rgba(26,25,22,0.12)' : accent}`,
        boxShadow: done
          ? 'none'
          : '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(26,25,22,0.04)',
        padding: '11px 12px 11px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 7,
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: '0.87rem', lineHeight: 1.35,
          color: done ? 'rgba(26,25,22,0.30)' : '#1e1c19',
          textDecoration: done ? 'line-through' : 'none',
          margin: 0, wordBreak: 'break-word',
          transition: 'color 0.2s',
        }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{
            fontSize: '0.58rem', letterSpacing: '0.10em', textTransform: 'uppercase',
            color: done ? 'rgba(26,25,22,0.22)' : accent,
            fontFamily: 'Georgia, serif', fontWeight: 600,
          }}>
            {P_LABEL[task.priority] ?? task.priority}
          </span>
          {task.due_date && (
            <span style={{ fontSize: '0.60rem', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(26,25,22,0.32)' }}>
              due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* XP reward */}
      {!done && (
        <span style={{
          flexShrink: 0,
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: '0.62rem', color: 'rgba(26,25,22,0.22)',
          background: 'rgba(26,25,22,0.04)',
          padding: '2px 7px', borderRadius: 5,
        }}>
          +{task.xp_reward}
        </span>
      )}

      {/* Checkbox */}
      <motion.button
        onClick={handle}
        whileTap={{ scale: 0.80 }}
        style={{
          flexShrink: 0,
          width: 26, height: 26, borderRadius: '50%',
          border: `1.5px solid ${done ? accent : 'rgba(26,25,22,0.18)'}`,
          background: done ? accent : 'transparent',
          cursor: done ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s',
        }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <motion.path
              d="M2 5L4 7L8 3"
              stroke="#fff" strokeWidth="1.6" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.22 }}
            />
          </svg>
        )}
      </motion.button>

      {showXP && <XPFloat xp={task.xp_reward} onDone={() => setShowXP(false)} />}
    </motion.div>
  )
}

// ─── Quick add ────────────────────────────────────────────────────────────────

function QuickAdd({ onAdded }: { onAdded: (task: T2Task) => void }) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed || busy) return
    setBusy(true)
    const result = await createTask({ title: trimmed, priority: 'medium', due_date: null })
    if (!result?.error) {
      onAdded({ id: `tmp-${Date.now()}`, title: trimmed, priority: 'medium', xp_reward: 25, status: 'todo', due_date: null })
    }
    setTitle('')
    setBusy(false)
    inputRef.current?.focus()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid rgba(26,25,22,0.10)',
      padding: '9px 10px 9px 14px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') void submit() }}
        placeholder="add a mission…"
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: '0.82rem', color: 'rgba(26,25,22,0.65)',
        }}
      />
      <motion.button
        type="button"
        onClick={() => void submit()}
        disabled={!title.trim() || busy}
        whileTap={{ scale: 0.92 }}
        style={{
          padding: '5px 14px',
          borderRadius: 7, border: 'none',
          background: title.trim() && !busy ? '#1a1916' : 'rgba(26,25,22,0.07)',
          color: title.trim() && !busy ? '#f5f0e8' : 'rgba(26,25,22,0.28)',
          cursor: title.trim() && !busy ? 'pointer' : 'default',
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: '0.72rem', flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        {busy ? '…' : 'add'}
      </motion.button>
    </div>
  )
}

// ─── Habit pill (dark theme) ──────────────────────────────────────────────────

function HabitPill({ habit, onComplete }: { habit: T2Habit; onComplete: (id: string) => void }) {
  const [done, setDone] = useState(habit.completedToday)
  const [showXP, setShowXP] = useState(false)
  const [, startTransition] = useTransition()

  const handle = () => {
    if (done) return
    setDone(true)
    setShowXP(true)
    const today = new Date().toISOString().slice(0, 10)
    startTransition(async () => {
      await logCompletion(habit.id, today)
      onComplete(habit.id)
    })
  }

  return (
    <motion.button
      onClick={handle}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.88 }}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: done ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${done ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 10,
        padding: '10px 12px 8px',
        cursor: done ? 'default' : 'pointer',
        minWidth: 64,
        transition: 'all 0.2s',
      }}
    >
      {/* Ring */}
      <div style={{ position: 'relative', width: 34, height: 34 }}>
        <svg width={34} height={34} style={{ rotate: '-90deg' }}>
          <circle cx={17} cy={17} r={13} fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth={2.5}/>
          <motion.circle
            cx={17} cy={17} r={13} fill="none"
            stroke={done ? '#c9a84c' : 'rgba(255,255,255,0.15)'}
            strokeWidth={2.5} strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 13}`}
            animate={{ strokeDashoffset: done ? 0 : 2 * Math.PI * 13 * 0.65 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {done ? (
            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          ) : (
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.58rem', color: 'rgba(255,255,255,0.30)' }}>
              {habit.current_streak > 0 ? habit.current_streak : '·'}
            </span>
          )}
        </div>
      </div>

      <span style={{
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize: '0.58rem', color: done ? 'rgba(201,168,76,0.80)' : 'rgba(255,255,255,0.35)',
        textAlign: 'center', lineHeight: 1.3, maxWidth: 60, wordBreak: 'break-word',
        transition: 'color 0.2s',
      }}>
        {habit.title}
      </span>

      {showXP && (
        <motion.span
          initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.75 }} onAnimationComplete={() => setShowXP(false)}
          style={{
            position: 'absolute', top: -4, right: -6, pointerEvents: 'none',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '0.68rem', color: '#c9a84c', whiteSpace: 'nowrap',
          }}
        >
          +{habit.xp_reward}
        </motion.span>
      )}
    </motion.button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  profile: Profile | null
  stats: {
    weeklyScore: number
    tasksCompleted: number
    streakDays: number
    streakActive: boolean
    levelXp: number
    level: number
    totalXp: number
  }
}

function getPlayerClass(level: number) {
  if (level < 5)  return 'Novice'
  if (level < 10) return 'Apprentice'
  if (level < 15) return 'Scholar'
  if (level < 25) return 'Sage'
  if (level < 40) return 'Expert'
  if (level < 50) return 'Master'
  return 'Legend'
}

export function DashboardType2Client({ profile, stats }: Props) {
  const [tasks, setTasks]     = useState<T2Task[]>([])
  const [habits, setHabits]   = useState<T2Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [modal, setModal] = useState<'note' | 'timer' | null>(null)
  const displayName = profile?.display_name ?? 'there'
  const xpProgress = (stats.levelXp / 1000) * 100
  const playerClass = getPlayerClass(stats.level)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'good morning'
    if (h < 17) return 'good afternoon'
    return 'good evening'
  })()

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('tasks')
        .select('id, title, priority, xp_reward, status, due_date')
        .in('status', ['todo', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) {
        const sorted = (data as T2Task[]).sort((a, b) =>
          (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3)
        )
        setTasks(sorted.slice(0, 7))
      }
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: habitData } = await (supabase as any)
        .from('habits').select('id, title, xp_reward, current_streak')
        .eq('archived', false).limit(6)
      if (!habitData) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: completions } = await (supabase as any)
        .from('habit_completions').select('habit_id')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .in('habit_id', (habitData as any[]).map((h: any) => h.id))
        .eq('completed_date', today)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doneSet = new Set((completions ?? []).map((c: any) => c.habit_id as string))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHabits((habitData as any[]).map((h: any) => ({ ...h, completedToday: doneSet.has(h.id as string) })))
    })()
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail) setAvatarUrl(profile?.avatar_url ?? null)
    }
    window.addEventListener('maable-avatar-update', handler)
    return () => window.removeEventListener('maable-avatar-update', handler)
  }, [profile?.avatar_url])

  const handleTaskComplete = useCallback((id: string) => {
    setTimeout(() => setTasks(prev => prev.filter(t => t.id !== id)), 600)
  }, [])

  const handleHabitComplete = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: true } : h))
  }, [])

  const handleTaskAdded = useCallback((task: T2Task) => {
    setTasks(prev => [task, ...prev])
  }, [])

  const isPhoto = avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob'))
  const doneCount = tasks.filter(t => t.status === 'done').length
  const remaining = tasks.length - doneCount

  return (
    <div style={{
      height: 'calc(100dvh - 4.5rem)',
      display: 'flex', overflow: 'hidden',
      background: '#f0ece3',
    }}>

      {/* ── Left: Missions ────────────────────────────────────────────────────── */}
      <div style={{
        flex: '0 0 58%',
        display: 'flex', flexDirection: 'column',
        background: '#faf7f0',
        borderRight: '1px solid rgba(26,25,22,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '2.2rem 2.8rem 0', flexShrink: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: '0.70rem', color: 'rgba(26,25,22,0.38)',
                  margin: '0 0 6px', letterSpacing: '0.03em',
                }}>
                  {greeting}, {displayName}
                </p>
                <h1 style={{
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: '2.4rem', color: '#1a1916', lineHeight: 1, margin: 0,
                }}>
                  Missions
                </h1>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: '0.68rem', color: 'rgba(26,25,22,0.32)', margin: 0,
                }}>
                  {dateStr}
                </p>
                {tasks.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                      fontFamily: 'Georgia, serif', fontStyle: 'italic',
                      fontSize: '0.68rem', color: remaining === 0 ? '#22c55e' : 'rgba(26,25,22,0.42)',
                      margin: '4px 0 0',
                    }}
                  >
                    {remaining === 0 ? 'all clear ✓' : `${remaining} remaining`}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(26,25,22,0.08)', marginBottom: 18 }} />
          </motion.div>
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '0 2.8rem', minHeight: 0 }}>
          {loading ? (
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(26,25,22,0.28)' }}>
              loading…
            </p>
          ) : tasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(26,25,22,0.28)', paddingTop: 4 }}>
                no missions yet — add one below
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Quick add */}
        <div style={{ padding: '12px 2.8rem 14px', flexShrink: 0 }}>
          <QuickAdd onAdded={handleTaskAdded} />
        </div>

        {/* Quick actions */}
        <div style={{
          padding: '0 2.8rem 1.8rem', flexShrink: 0,
          borderTop: '1px solid rgba(26,25,22,0.06)',
          paddingTop: 14,
          display: 'flex', gap: 8,
        }}>
          <motion.button
            onClick={() => setModal('timer')}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px',
              background: 'rgba(26,25,22,0.05)',
              border: '1px solid rgba(26,25,22,0.09)',
              borderRadius: 18, cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: '0.70rem', color: 'rgba(26,25,22,0.50)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/icon-timer.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain', opacity: 0.6 }} draggable={false} />
            timer
          </motion.button>

          <motion.button
            onClick={() => setModal('note')}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px',
              background: 'rgba(26,25,22,0.05)',
              border: '1px solid rgba(26,25,22,0.09)',
              borderRadius: 18, cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: '0.70rem', color: 'rgba(26,25,22,0.50)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            note
          </motion.button>

          <Link href="/tasks" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ y: -1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px',
                background: 'rgba(26,25,22,0.05)',
                border: '1px solid rgba(26,25,22,0.09)',
                borderRadius: 18,
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '0.70rem', color: 'rgba(26,25,22,0.50)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              all tasks
            </motion.div>
          </Link>
        </div>
      </div>

      {/* ── Right: Character + Stats + Habits ────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        background: '#111009',
        overflow: 'hidden',
      }}>

        {/* Character portrait */}
        <div style={{
          flex: '0 0 46%',
          position: 'relative',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* Radial glow behind character */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(201,168,76,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingTop: 24 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isPhoto ? avatarUrl! : '/illustrations/avatar-user.png'}
              alt={displayName}
              style={{
                maxHeight: '100%',
                maxWidth: isPhoto ? '62%' : '72%',
                objectFit: isPhoto ? 'cover' : 'contain',
                objectPosition: 'center top',
                display: 'block',
                borderRadius: isPhoto ? 10 : 0,
                filter: isPhoto ? 'none' : 'drop-shadow(0 0 18px rgba(201,168,76,0.12))',
              }}
              draggable={false}
            />
          </motion.div>
        </div>

        {/* Identity strip */}
        <div style={{
          padding: '14px 20px 12px',
          borderTop: '1px solid rgba(201,168,76,0.10)',
          background: 'rgba(0,0,0,0.25)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(255,255,255,0.80)', margin: 0, lineHeight: 1.2 }}>
                {displayName}
              </p>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'rgba(201,168,76,0.55)', margin: '2px 0 0' }}>
                {playerClass} · Lv.{stats.level}
              </p>
            </div>
            <span style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: '0.62rem', color: 'rgba(201,168,76,0.60)',
            }}>
              {stats.levelXp.toLocaleString()} xp
            </span>
          </div>

          {/* XP bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              style={{ height: '100%', background: '#c9a84c', borderRadius: 3 }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          {[
            { label: 'streak', value: stats.streakDays > 0 ? `${stats.streakDays}d` : '—', color: stats.streakDays > 0 ? '#f59e0b' : 'rgba(255,255,255,0.25)' },
            { label: 'this week', value: `${stats.weeklyScore.toLocaleString()}`, color: 'rgba(255,255,255,0.70)' },
            { label: 'tasks done', value: `${stats.tasksCompleted}`, color: 'rgba(255,255,255,0.70)' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.05rem', color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Rituals */}
        <div style={{ flex: 1, padding: '14px 16px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <p style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '0.55rem', letterSpacing: '0.20em', textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.40)', margin: '0 0 10px',
          }}>
            rituals
          </p>

          {habits.length === 0 ? (
            <Link href="/habits" style={{ textDecoration: 'none' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(255,255,255,0.20)' }}>
                add habits →
              </p>
            </Link>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {habits.map(h => (
                <HabitPill key={h.id} habit={h} onComplete={handleHabitComplete} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'note'  && <QuickNoteModal  onClose={() => setModal(null)} />}
        {modal === 'timer' && <QuickTimerModal onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  )
}
