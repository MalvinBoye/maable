'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { Profile } from '@maable/core'
import { createClient } from '@/lib/supabase/client'
import { toggleTask } from '@/app/(app)/tasks/actions'
import { logCompletion } from '@/app/(app)/habits/actions'
import { QuickNoteModal, QuickTimerModal } from '@/components/app/quick-actions'

const GOLD  = '#c9a84c'
const GOLD2 = 'rgba(201,168,76,0.45)'
const GOLD3 = 'rgba(201,168,76,0.12)'
const INK   = '#0a0908'
const PAPER = 'rgba(255,255,255,0.06)'

type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
type TaskStatus   = 'todo' | 'in_progress' | 'done'

interface T3Task {
  id: string
  title: string
  priority: TaskPriority
  xp_reward: number
  status: TaskStatus
  due_date: string | null
}

interface T3Habit {
  id: string
  title: string
  xp_reward: number
  current_streak: number
  completedToday: boolean
}

const P_LABEL: Record<string, string>  = { urgent: 'urgent', high: 'high', medium: 'med', low: 'low' }
const P_COLOR: Record<string, string>  = { urgent: '#e74c3c', high: '#e67e22', medium: '#60a5fa', low: '#4ade80' }
const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

// ─── XP float ─────────────────────────────────────────────────────────────────

function GoldFloat({ xp, onDone }: { xp: number; onDone: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.75, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{
        position: 'absolute', right: 0, top: -2, pointerEvents: 'none',
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize: '0.72rem', color: GOLD, whiteSpace: 'nowrap',
      }}
    >
      +{xp} xp
    </motion.span>
  )
}

// ─── Quest row ────────────────────────────────────────────────────────────────

function QuestRow({ task, onComplete }: { task: T3Task; onComplete: (id: string) => void }) {
  const [done, setDone] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [, startTransition] = useTransition()

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
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, transition: { delay: 0.3 } }}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        borderBottom: `1px solid rgba(201,168,76,0.08)`,
        cursor: done ? 'default' : 'pointer',
      }}
      onClick={handle}
      whileHover={!done ? { backgroundColor: 'rgba(201,168,76,0.04)' } : {}}
    >
      {/* Check mark */}
      <div style={{
        width: 16, height: 16, flexShrink: 0, borderRadius: 2,
        border: `1px solid ${done ? GOLD : GOLD2}`,
        background: done ? GOLD3 : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
      }}>
        {done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <motion.path
              d="M1 4l2 2 4-3.5" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2 }}
            />
          </svg>
        )}
      </div>

      {/* Priority badge */}
      <span style={{
        fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase',
        color: done ? 'rgba(255,255,255,0.18)' : P_COLOR[task.priority],
        fontFamily: 'Georgia, serif', flexShrink: 0, minWidth: 28,
        opacity: done ? 0.4 : 1,
      }}>
        {P_LABEL[task.priority]}
      </span>

      {/* Title */}
      <p style={{
        flex: 1, margin: 0,
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize: '0.85rem', lineHeight: 1.3,
        color: done ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.78)',
        textDecoration: done ? 'line-through' : 'none',
        transition: 'color 0.2s',
      }}>
        {task.title}
      </p>

      {/* XP */}
      {!done && (
        <span style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: '0.62rem', color: GOLD2, flexShrink: 0,
        }}>
          +{task.xp_reward}
        </span>
      )}

      {showXP && <GoldFloat xp={task.xp_reward} onDone={() => setShowXP(false)} />}
    </motion.div>
  )
}

// ─── Ability circle ───────────────────────────────────────────────────────────

function AbilityCircle({ habit, onComplete }: { habit: T3Habit; onComplete: (id: string) => void }) {
  const [done, setDone] = useState(habit.completedToday)
  const [showXP, setShowXP] = useState(false)
  const [, startTransition] = useTransition()
  const CIRC = 2 * Math.PI * 17

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
      whileHover={!done ? { y: -2 } : {}}
      whileTap={!done ? { scale: 0.9 } : {}}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        background: 'transparent', border: 'none',
        cursor: done ? 'default' : 'pointer', minWidth: 52,
      }}
    >
      <div style={{ position: 'relative', width: 42, height: 42 }}>
        <svg width={42} height={42} style={{ rotate: '-90deg' }}>
          <circle cx={21} cy={21} r={17} fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth={2}/>
          <motion.circle
            cx={21} cy={21} r={17} fill="none"
            stroke={done ? GOLD : GOLD2}
            strokeWidth={2} strokeLinecap="round"
            strokeDasharray={`${CIRC}`}
            animate={{ strokeDashoffset: done ? 0 : CIRC * 0.65 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done ? (
            <motion.svg
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              width="10" height="10" viewBox="0 0 10 10" fill="none"
            >
              <path d="M2 5l2.5 2.5 3.5-3.5" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          ) : (
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.58rem', color: GOLD2 }}>
              {habit.current_streak > 0 ? habit.current_streak : '·'}
            </span>
          )}
        </div>
      </div>
      <span style={{
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize: '0.56rem', color: done ? GOLD : 'rgba(255,255,255,0.38)',
        textAlign: 'center', lineHeight: 1.25, maxWidth: 56, wordBreak: 'break-word',
      }}>
        {habit.title}
      </span>
      {showXP && <GoldFloat xp={habit.xp_reward} onDone={() => setShowXP(false)} />}
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

export function DashboardType3Client({ profile, stats }: Props) {
  const [tasks, setTasks]     = useState<T3Task[]>([])
  const [habits, setHabits]   = useState<T3Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [modal, setModal] = useState<'note' | 'timer' | null>(null)
  const displayName = profile?.display_name ?? 'Adventurer'
  const playerClass = getPlayerClass(stats.level)
  const xpProgress  = (stats.levelXp / 1000) * 100

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
        const sorted = (data as T3Task[]).sort((a, b) =>
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
        .from('habits')
        .select('id, title, xp_reward, current_streak')
        .eq('archived', false)
        .limit(8)
      if (!habitData) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: completions } = await (supabase as any)
        .from('habit_completions')
        .select('habit_id')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .in('habit_id', (habitData as any[]).map((h: any) => h.id))
        .eq('completed_date', today)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const done = new Set((completions ?? []).map((c: any) => c.habit_id as string))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHabits((habitData as any[]).map((h: any) => ({ ...h, completedToday: done.has(h.id as string) })))
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
    setTimeout(() => setTasks(prev => prev.filter(t => t.id !== id)), 500)
  }, [])

  const handleHabitComplete = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: true } : h))
  }, [])

  const isPhoto = avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob'))

  return (
    <div style={{
      height: 'calc(100dvh - 4.5rem)',
      display: 'flex',
      backgroundColor: INK,
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.006) 3px, rgba(255,255,255,0.006) 4px)',
      }} />

      {/* Gold corner brackets */}
      {(['tl','tr','bl','br'] as const).map(c => (
        <div key={c} style={{
          position: 'absolute', zIndex: 2,
          width: 14, height: 14,
          top:    c.startsWith('t') ? 10 : undefined,
          bottom: c.startsWith('b') ? 10 : undefined,
          left:   c.endsWith('l')   ? 10 : undefined,
          right:  c.endsWith('r')   ? 10 : undefined,
          borderTop:    c.startsWith('t') ? `1.5px solid ${GOLD2}` : 'none',
          borderBottom: c.startsWith('b') ? `1.5px solid ${GOLD2}` : 'none',
          borderLeft:   c.endsWith('l')   ? `1.5px solid ${GOLD2}` : 'none',
          borderRight:  c.endsWith('r')   ? `1.5px solid ${GOLD2}` : 'none',
        }} />
      ))}

      {/* ── Left: Character portrait ──────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1,
        flex: '0 0 36%',
        display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${GOLD3}`,
        overflow: 'hidden',
      }}>
        {/* Character image */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingTop: 24, overflow: 'hidden' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isPhoto ? avatarUrl! : '/illustrations/avatar-user.png'}
              alt={displayName}
              style={{
                maxHeight: '100%', maxWidth: isPhoto ? '65%' : '80%',
                objectFit: isPhoto ? 'cover' : 'contain',
                objectPosition: 'center top',
                borderRadius: isPhoto ? 8 : 0,
                filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.18))',
              }}
              draggable={false}
            />
          </motion.div>
        </div>

        {/* Name plate */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${GOLD3}`,
          background: 'rgba(201,168,76,0.04)',
        }}>
          <p style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '1.15rem', color: 'rgba(255,255,255,0.88)',
            margin: '0 0 3px', lineHeight: 1.1,
          }}>
            {displayName}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase',
              color: GOLD, border: `1px solid ${GOLD3}`,
              padding: '2px 7px', borderRadius: 2, fontFamily: 'Georgia, serif',
            }}>
              {playerClass}
            </span>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.65rem', color: GOLD2 }}>
              Lv.{stats.level}
            </span>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ padding: '10px 20px 16px', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD2, fontFamily: 'Georgia, serif' }}>exp</span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)' }}>
              {stats.levelXp}/1000
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.3, ease: [0.16,1,0.3,1], delay: 0.4 }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${GOLD}88, ${GOLD})`, borderRadius: 2 }}
            />
          </div>
        </div>
      </div>

      {/* ── Right: Quests + Abilities ──────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1,
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Stats header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          padding: '12px 24px',
          borderBottom: `1px solid ${GOLD3}`,
          background: 'rgba(201,168,76,0.03)',
          flexShrink: 0,
        }}>
          {[
            { label: 'streak', value: `${stats.streakDays}d`, highlight: stats.streakDays > 0 },
            { label: 'week pts', value: stats.weeklyScore.toLocaleString(), highlight: false },
            { label: 'tasks done', value: stats.tasksCompleted.toString(), highlight: false },
            { label: 'total xp', value: stats.totalXp.toLocaleString(), highlight: false },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center',
              borderLeft: i === 0 ? 'none' : `1px solid ${GOLD3}`,
            }}>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.0rem', color: s.highlight ? GOLD : 'rgba(255,255,255,0.72)', margin: '0 0 1px', lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD2, margin: 0, fontFamily: 'Georgia, serif' }}>
                {s.label}
              </p>
            </div>
          ))}

          {/* Quick action icons */}
          <div style={{ display: 'flex', gap: 6, marginLeft: 16, flexShrink: 0 }}>
            <button
              onClick={() => setModal('timer')}
              title="Quick timer"
              style={{ background: PAPER, border: `1px solid ${GOLD3}`, borderRadius: 4, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/icon-timer.png" alt="timer" style={{ width: 14, height: 14, objectFit: 'contain', filter: 'brightness(0.8) sepia(1) hue-rotate(10deg) saturate(2)' }} draggable={false} />
            </button>
            <button
              onClick={() => setModal('note')}
              title="Quick note"
              style={{ background: PAPER, border: `1px solid ${GOLD3}`, borderRadius: 4, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/icon-calendar.png" alt="note" style={{ width: 14, height: 14, objectFit: 'contain', filter: 'brightness(0.8) sepia(1) hue-rotate(10deg) saturate(2)' }} draggable={false} />
            </button>
            <Link href="/moodboard">
              <button
                title="Mood board"
                style={{ background: PAPER, border: `1px solid ${GOLD3}`, borderRadius: 4, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="9" height="11" rx="1.5" stroke={GOLD2} strokeWidth="1.5"/>
                  <rect x="13" y="2" width="9" height="6" rx="1.5" stroke={GOLD2} strokeWidth="1.5"/>
                  <rect x="13" y="10" width="9" height="12" rx="1.5" stroke={GOLD2} strokeWidth="1.5"/>
                  <rect x="2" y="15" width="9" height="7" rx="1.5" stroke={GOLD2} strokeWidth="1.5"/>
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Active Quests */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          borderBottom: `1px solid ${GOLD3}`,
          overflow: 'hidden',
          minHeight: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px 8px',
            borderBottom: `1px solid ${GOLD3}`,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontFamily: 'Georgia, serif' }}>
              active quests
            </span>
            <Link href="/tasks" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '0.58rem', color: GOLD2, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                view all →
              </span>
            </Link>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', minHeight: 0 }}>
            {loading ? (
              <p style={{ padding: '14px 24px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>
                loading…
              </p>
            ) : tasks.length === 0 ? (
              <p style={{ padding: '14px 24px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.22)' }}>
                no active quests — visit tasks to add some
              </p>
            ) : (
              <AnimatePresence>
                {tasks.map(task => (
                  <QuestRow key={task.id} task={task} onComplete={handleTaskComplete} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Daily Abilities */}
        <div style={{
          flexShrink: 0,
          padding: '12px 24px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontFamily: 'Georgia, serif' }}>
              daily abilities
            </span>
            <Link href="/habits" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '0.58rem', color: GOLD2, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                view all →
              </span>
            </Link>
          </div>

          {habits.length === 0 ? (
            <Link href="/habits" style={{ textDecoration: 'none' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.75rem', color: 'rgba(255,255,255,0.20)' }}>
                add habits to unlock abilities →
              </p>
            </Link>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {habits.map(h => (
                <AbilityCircle key={h.id} habit={h} onComplete={handleHabitComplete} />
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
