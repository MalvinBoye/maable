'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { Profile } from '@maable/core'
import { QuickNoteModal, QuickTimerModal } from '@/components/app/quick-actions'
import { createTask } from '@/app/(app)/tasks/actions'
import { useArchitect } from '@/lib/architect-context'
import { useADHD } from '@/lib/adhd-context'
import { DragResizeCard, type CardBounds } from '@/components/app/drag-resize'
import { NowPlayingCard } from '@/components/app/now-playing'
import { LevelUpEffect } from '@/components/app/level-up-effect'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UrgentTask {
  id: string; title: string; priority: string; due_date: string | null
}

interface DashboardClientProps {
  profile: Profile | null
  urgentTasks: UrgentTask[]
  stats: {
    weeklyScore: number
    tasksCompleted: number
    streakDays: number
    streakActive: boolean
    levelXp: number   // xp within current level (0–999)
    level: number
    totalXp: number
  }
}

type LifeCategory = 'career' | 'student' | 'hobbies' | 'reading' | 'lazy'

const CATEGORY_META: Record<LifeCategory, { label: string; tagline: string; href: string }> = {
  career:  { label: 'Career',         tagline: 'Climb with intention',     href: '/career'  },
  student: { label: 'Student',        tagline: 'Learn something today',    href: '/student' },
  hobbies: { label: 'Hobbies',        tagline: 'Make time for joy',        href: '/hobbies' },
  reading: { label: 'Reading Corner', tagline: 'Every book, a new world',  href: '/reading' },
  lazy:    { label: 'Feeling Lazy',   tagline: 'Rest is productive too',   href: '/lazy'    },
}

const CARD_SHADOW   = '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.07)'
const CARD_SHADOW_H = '0 14px 44px rgba(0,0,0,0.12), 0 0 0 1px rgba(26,25,22,0.10)'

// ─── Animated counter ────────────────────────────────────────────────────────

function useCounter(target: number, duration = 1100) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [target, duration])
  return val
}

// ─── Level ring ───────────────────────────────────────────────────────────────

function LevelRing({ level, progress }: { level: number; progress: number }) {
  const SIZE = 80; const R = 33; const CIRC = 2 * Math.PI * R
  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="absolute inset-0" style={{ rotate: '-90deg' }}>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(26,25,22,0.07)" strokeWidth={3.5} />
        <motion.circle
          cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
          stroke="var(--ink, #1a1916)"
          strokeWidth={3.5} strokeLinecap="round"
          strokeDasharray={`${CIRC}`}
          animate={{ strokeDashoffset: CIRC - CIRC * progress }}
          initial={{ strokeDashoffset: CIRC }}
          transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span
          className="leading-none text-stone-900"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22 }}
        >
          {level}
        </span>
        <span className="text-[9px] text-stone-400 tracking-widest uppercase">lv.</span>
      </div>
    </div>
  )
}

// ─── Sparkline bars (7-day score representation) ──────────────────────────────

function SparkBars({ score, max = 500 }: { score: number; max?: number }) {
  const progress = Math.min(score / max, 1)
  // Plausible-looking historical bars ending at current progress
  const heights = [0.12, 0.38, 0.22, 0.55, 0.30, 0.48, progress]
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 28 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1"
          style={{
            originY: 1,
            backgroundColor: i === 6 ? 'var(--ink, #1a1916)' : 'rgba(26,25,22,0.10)',
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: Math.max(h, 0.06) }}
          transition={{ delay: 0.08 + i * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
        />
      ))}
    </div>
  )
}

// ─── Streak dot strip ─────────────────────────────────────────────────────────

function StreakDots({ days, active }: { days: number; active: boolean }) {
  const filled = Math.min(days, 7)
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 7 }, (_, i) => {
        const on = i >= 7 - filled
        return (
          <motion.div
            key={i}
            className="w-[7px] h-[7px] rounded-full"
            style={{ backgroundColor: on ? 'var(--ink, #1a1916)' : 'rgba(26,25,22,0.10)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
          />
        )
      })}
      {active && (
        <motion.div
          className="w-[7px] h-[7px] rounded-full bg-amber-400"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}

// ─── Thin progress bar ────────────────────────────────────────────────────────

function ThinBar({ progress, delay = 0 }: { progress: number; delay?: number }) {
  return (
    <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(26,25,22,0.07)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: 'var(--ink, #1a1916)' }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(progress, 1) * 100}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 20, delay }}
      />
    </div>
  )
}

// ─── Category bento card ─────────────────────────────────────────────────────

function CategoryBentoCard({
  id, delay = 0, fontSize = 15,
}: {
  id: LifeCategory; delay?: number; fontSize?: number
}) {
  const [hovered, setHovered] = useState(false)
  const { label, tagline, href } = CATEGORY_META[id]
  return (
    <Link href={href} className="block h-full">
      <motion.div
        className="relative h-full flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--paper, #fff)', boxShadow: CARD_SHADOW }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.38, ease: 'easeOut' }}
        whileHover={{ y: -5, boxShadow: CARD_SHADOW_H }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        {/* Illustration */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-6 pt-6 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/illustrations/category-${id}.png`}
            alt={label}
            className="w-full h-full object-contain"
            style={{
              transition: 'transform 0.32s ease-out',
              transform: hovered ? 'scale(1.07)' : 'scale(1)',
            }}
            draggable={false}
          />
        </div>

        {/* Label */}
        <div className="shrink-0 px-5 pb-5 pt-1">
          <div className="h-px mb-3" style={{ backgroundColor: 'rgba(26,25,22,0.07)' }} />
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p
                className="text-stone-800 leading-tight truncate"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize }}
              >
                {label}
              </p>
              <p
                className="text-xs text-stone-400 mt-0.5 truncate"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {tagline}
              </p>
            </div>
            <motion.span
              className="shrink-0 text-stone-400 text-sm"
              style={{ fontFamily: 'Georgia, serif' }}
              animate={{ x: hovered ? 0 : -4, opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.14 }}
            >
              →
            </motion.span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`bg-white px-5 py-5 flex flex-col cursor-default ${className}`}
      style={{ boxShadow: CARD_SHADOW }}
      whileHover={{ boxShadow: CARD_SHADOW_H, y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      {children}
    </motion.div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-stone-400 mb-3 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
      {children}
    </p>
  )
}

function CardValue({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-stone-900 leading-none"
      style={{ fontFamily: 'fangsong', fontStyle: 'italic', fontSize: '2rem' }}
    >
      {children}
    </p>
  )
}

// ─── The six stat cards ───────────────────────────────────────────────────────

function LevelCard({ level, levelXp }: { level: number; levelXp: number }) {
  const progress = levelXp / 1000
  const xpToNext = 1000 - levelXp
  return (
    <Card>
      <CardLabel>level —</CardLabel>
      <div className="flex items-center gap-4 flex-1">
        <LevelRing level={level} progress={progress} />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <ThinBar progress={progress} delay={0.4} />
          <p className="text-xs text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            <span className="text-stone-700">{levelXp.toLocaleString()}</span> / 1,000 xp
          </p>
          <p className="text-xs text-stone-300">
            {xpToNext} to Level {level + 1}
          </p>
        </div>
      </div>
    </Card>
  )
}

function ScoreCard({ score }: { score: number }) {
  const count = useCounter(score)
  return (
    <Card>
      <CardLabel>this week —</CardLabel>
      <CardValue>{count.toLocaleString()}</CardValue>
      <p className="text-xs text-stone-400 mt-0.5 mb-3" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>pts</p>
      <div className="mt-auto">
        <SparkBars score={score} max={350} />
      </div>
    </Card>
  )
}

function StreakCard({ days, active }: { days: number; active: boolean }) {
  const count = useCounter(days)
  return (
    <Card>
      <CardLabel>streak —</CardLabel>
      <div className="flex items-baseline gap-2 mb-1">
        <CardValue>{count > 0 ? count : '—'}</CardValue>
        {active && count > 0 && (
          <motion.span
            className="text-xs leading-none"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#d97706' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          >
            streak
          </motion.span>
        )}
      </div>
      {count > 0 && <p className="text-xs text-stone-400 mb-3">days</p>}
      <div className="mt-auto">
        <StreakDots days={days} active={active} />
      </div>
    </Card>
  )
}

function TasksCard({ count: taskCount, xpEarned }: { count: number; xpEarned: number }) {
  const count = useCounter(taskCount)
  const xp = useCounter(xpEarned)
  return (
    <Card>
      <CardLabel>done this week —</CardLabel>
      <CardValue>{count > 0 ? count : '—'}</CardValue>
      <p className="text-xs text-stone-400 mt-1">tasks</p>
      <div className="mt-auto pt-3 border-t border-stone-50">
        <p
          className="text-xs text-stone-500"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          +{xp.toLocaleString()} xp earned
        </p>
      </div>
    </Card>
  )
}

function TotalXpCard({ totalXp }: { totalXp: number }) {
  const count = useCounter(totalXp)
  // milestone every 5000 XP
  const milestone = Math.ceil(totalXp / 5000) * 5000
  const toMilestone = milestone - totalXp
  const progress = 1 - toMilestone / 5000
  return (
    <Card>
      <CardLabel>total xp —</CardLabel>
      <CardValue>{count.toLocaleString()}</CardValue>
      <p className="text-xs text-stone-400 mt-1 mb-3">xp</p>
      <div className="mt-auto space-y-1.5">
        <ThinBar progress={progress} delay={0.3} />
        <p className="text-xs text-stone-300">
          {toMilestone.toLocaleString()} to {(milestone / 1000).toFixed(0)}k milestone
        </p>
      </div>
    </Card>
  )
}

function NextLevelCard({ levelXp }: { levelXp: number }) {
  const remaining = 1000 - levelXp
  const count = useCounter(remaining)
  const progress = levelXp / 1000
  return (
    <Card>
      <CardLabel>next level —</CardLabel>
      <CardValue>{count.toLocaleString()}</CardValue>
      <p className="text-xs text-stone-400 mt-1 mb-3">xp to go</p>
      <div className="mt-auto space-y-1.5">
        <ThinBar progress={progress} delay={0.3} />
        <p className="text-xs text-stone-300">
          {Math.round(progress * 100)}% complete
        </p>
      </div>
    </Card>
  )
}

// ─── Quick action card ────────────────────────────────────────────────────────

function QuickActionCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="rounded-2xl bg-white px-6 py-4 flex items-center gap-3 w-full"
      style={{ boxShadow: CARD_SHADOW, color: '#78716c' }}
      whileHover={{ boxShadow: CARD_SHADOW_H, y: -4, color: '#1a1916' }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      {icon}
      <span className="text-sm" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        {label}
      </span>
    </motion.button>
  )
}

// ─── Quick add task card ──────────────────────────────────────────────────────

function QuickAddTaskCard() {
  const [open, setOpen]     = useState(false)
  const [title, setTitle]   = useState('')
  const [busy, setBusy]     = useState(false)
  const [done, setDone]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    if (!title.trim() || busy) return
    setBusy(true)
    await createTask({ title: title.trim(), priority: 'medium', due_date: null })
    setTitle('')
    setBusy(false)
    setDone(true)
    setTimeout(() => { setDone(false); setOpen(false) }, 900)
  }

  return (
    <motion.div
      className="rounded-2xl bg-white w-full overflow-hidden"
      style={{ boxShadow: open ? '0 14px 44px rgba(0,0,0,0.12), 0 0 0 1.5px rgba(26,25,22,0.12)' : CARD_SHADOW }}
      animate={{ height: open ? 'auto' : 'auto' }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      {!open ? (
        <motion.button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 60) }}
          className="px-6 py-4 flex items-center gap-3 w-full"
          style={{ color: '#78716c' }}
          whileHover={{ boxShadow: CARD_SHADOW_H, y: -4, color: '#1a1916' }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          <span className="text-sm" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Quick add task
          </span>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 py-4"
        >
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { void submit() }
              if (e.key === 'Escape') { setOpen(false); setTitle('') }
            }}
            placeholder="What needs to be done?"
            className="w-full text-sm text-stone-800 placeholder-stone-300 bg-transparent focus:outline-none mb-3"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', borderBottom: '1px solid rgba(26,25,22,0.10)', paddingBottom: 6 }}
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setOpen(false); setTitle('') }}
              className="text-xs text-stone-300 hover:text-stone-500 transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              cancel
            </button>
            <button
              onClick={() => { void submit() }}
              disabled={!title.trim() || busy}
              className="text-xs px-3 py-1.5 rounded-lg text-white transition-all"
              style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                backgroundColor: done ? '#22c55e' : '#1a1916',
                opacity: title.trim() ? 1 : 0.4,
              }}
            >
              {done ? 'Added ✓' : busy ? '…' : 'Add task'}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Mini Playground ─────────────────────────────────────────────────────────

interface MiniObj {
  id: string
  type: 'chibi' | 'ball' | 'coin'
  x: number; y: number
  vx: number; vy: number
  rot: number; vrot: number
  w: number; h: number
}

const G_MINI = 0.38
const AIR_MINI = 0.992
const ANG_MINI = 0.978

function makeMiniScene(W: number, H: number): MiniObj[] {
  return [
    { id: 'c1', type: 'chibi', x: W * 0.22, y: H * 0.35, vx:  0.3, vy: 0,    rot: -5, vrot:  0.1, w: 52, h: 68 },
    { id: 'c2', type: 'chibi', x: W * 0.72, y: H * 0.45, vx: -0.4, vy: 0,    rot:  8, vrot: -0.1, w: 52, h: 68 },
    { id: 'b1', type: 'ball',  x: W * 0.42, y: H * 0.25, vx:  1.4, vy: -0.5, rot:  0, vrot:  2.2, w: 38, h: 38 },
    { id: 'b2', type: 'ball',  x: W * 0.58, y: H * 0.65, vx: -1.0, vy: 0,    rot:  0, vrot: -1.8, w: 38, h: 38 },
    { id: 'n1', type: 'coin',  x: W * 0.28, y: H * 0.70, vx:  0.6, vy: 0,    rot: 15, vrot:  3.5, w: 30, h: 30 },
    { id: 'n2', type: 'coin',  x: W * 0.80, y: H * 0.22, vx: -1.6, vy: 0.4,  rot: 30, vrot: -2.8, w: 30, h: 30 },
    { id: 'n3', type: 'coin',  x: W * 0.50, y: H * 0.42, vx:  0.2, vy: -0.3, rot: 55, vrot:  1.5, w: 30, h: 30 },
  ]
}

function MiniObjVisual({ type, w, h }: { type: MiniObj['type']; w: number; h: number }) {
  if (type === 'chibi') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/illustrations/avatar-user.png" alt="" width={w} height={h}
        className="w-full h-full object-contain pointer-events-none select-none" draggable={false} />
    )
  }
  if (type === 'ball') {
    return (
      <svg width={w} height={h} viewBox="0 0 38 38" className="pointer-events-none select-none overflow-visible">
        <circle cx={19} cy={19} r={15} fill="none" stroke="#1a1916" strokeWidth={2} filter="url(#sketch-mini)" />
        <path d="M 10 14 Q 19 10 28 14" fill="none" stroke="#1a1916" strokeWidth={1} opacity={0.25} />
      </svg>
    )
  }
  return (
    <svg width={w} height={h} viewBox="0 0 30 30" className="pointer-events-none select-none overflow-visible">
      <ellipse cx={15} cy={15} rx={12} ry={12} fill="#f5e6a0" stroke="#c4a84f" strokeWidth={1.8} filter="url(#sketch-mini)" />
      <text x={15} y={19} textAnchor="middle" fontSize={11} fill="#8a7030"
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>$</text>
    </svg>
  )
}

function MiniPlayground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const objsRef = useRef<Map<string, MiniObj>>(new Map())
  const domRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const rafRef = useRef<number>(0)
  const gravityRef = useRef(true)
  const [gravity, setGravity] = useState(true)
  const [objs, setObjs] = useState<MiniObj[]>([])
  const grabRef = useRef<{
    id: string; ox: number; oy: number
    hist: { x: number; y: number; t: number }[]
  } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const W = container.clientWidth
    const H = container.clientHeight

    const scene = makeMiniScene(W, H)
    objsRef.current.clear()
    scene.forEach(o => objsRef.current.set(o.id, { ...o }))
    setObjs(scene)

    const tick = () => {
      const cW = container.clientWidth
      const cH = container.clientHeight
      for (const [id, obj] of objsRef.current) {
        if (grabRef.current?.id === id) continue
        if (gravityRef.current) obj.vy += G_MINI
        obj.vx *= AIR_MINI
        obj.vy *= AIR_MINI
        obj.vrot *= ANG_MINI
        obj.x += obj.vx
        obj.y += obj.vy
        obj.rot += obj.vrot

        const rw = obj.w / 2, rh = obj.h / 2
        if (obj.x - rw < 0)   { obj.x = rw;      obj.vx =  Math.abs(obj.vx) * 0.55 }
        if (obj.x + rw > cW)  { obj.x = cW - rw; obj.vx = -Math.abs(obj.vx) * 0.55 }
        if (obj.y - rh < 0)   { obj.y = rh;      obj.vy =  Math.abs(obj.vy) * 0.55 }
        if (obj.y + rh > cH)  {
          obj.y = cH - rh
          obj.vy = -Math.abs(obj.vy) * 0.60
          obj.vrot *= 0.80
          if (Math.abs(obj.vy) < 0.5) obj.vy = 0
        }

        const el = domRefs.current.get(id)
        if (el) el.style.transform = `translate(${obj.x - rw}px,${obj.y - rh}px) rotate(${obj.rot}deg)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (e.pointerType === 'touch') return  // let touch scroll the page
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const obj = objsRef.current.get(id)
    if (!obj) return
    grabRef.current = {
      id,
      ox: e.clientX - obj.x,
      oy: e.clientY - obj.y,
      hist: [{ x: e.clientX, y: e.clientY, t: Date.now() }],
    }
    obj.vx = 0; obj.vy = 0; obj.vrot = 0
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const grab = grabRef.current
    if (!grab) return
    const obj = objsRef.current.get(grab.id)
    if (!obj) return
    obj.x = e.clientX - grab.ox
    obj.y = e.clientY - grab.oy
    grab.hist.push({ x: e.clientX, y: e.clientY, t: Date.now() })
    if (grab.hist.length > 6) grab.hist.shift()
    const el = domRefs.current.get(grab.id)
    if (el) el.style.transform = `translate(${obj.x - obj.w / 2}px,${obj.y - obj.h / 2}px) rotate(${obj.rot}deg)`
  }, [])

  const onPointerUp = useCallback(() => {
    const grab = grabRef.current
    if (!grab) return
    const obj = objsRef.current.get(grab.id)
    if (obj && grab.hist.length >= 2) {
      const first = grab.hist[0]
      const last  = grab.hist[grab.hist.length - 1]
      if (first && last) {
        const dt = Math.max((last.t - first.t) / 1000, 0.016)
        obj.vx   = ((last.x - first.x) / dt) * 0.04 * 1.8
        obj.vy   = ((last.y - first.y) / dt) * 0.04 * 1.8
        obj.vrot = (Math.random() - 0.5) * 8
      }
    }
    grabRef.current = null
  }, [])

  const toggleGravity = useCallback(() => {
    const next = !gravityRef.current
    gravityRef.current = next
    setGravity(next)
    if (!next) {
      for (const obj of objsRef.current.values()) obj.vy = -0.3
    }
  }, [])

  const chaos = useCallback(() => {
    for (const obj of objsRef.current.values()) {
      obj.vx   = (Math.random() - 0.5) * 20
      obj.vy   = (Math.random() - 0.5) * 18
      obj.vrot = (Math.random() - 0.5) * 22
    }
  }, [])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Physics canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ borderRadius: 16, backgroundColor: 'var(--paper-warm, #faf9f7)', cursor: 'default', maxHeight: 280 }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Sketch filter */}
        <svg width={0} height={0} style={{ position: 'absolute' }}>
          <defs>
            <filter id="sketch-mini">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={1.8} />
            </filter>
          </defs>
        </svg>

        {/* Physics objects */}
        {objs.map(obj => (
          <div
            key={obj.id}
            ref={el => {
              if (el) {
                domRefs.current.set(obj.id, el)
                const o = objsRef.current.get(obj.id)
                if (o) el.style.transform = `translate(${o.x - o.w / 2}px,${o.y - o.h / 2}px) rotate(${o.rot}deg)`
              }
            }}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: obj.w, height: obj.h,
              cursor: 'grab', willChange: 'transform',
            }}
            onPointerDown={e => onPointerDown(e, obj.id)}
          >
            <MiniObjVisual type={obj.type} w={obj.w} h={obj.h} />
          </div>
        ))}

        {/* Floor hint */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ backgroundColor: 'rgba(26,25,22,0.06)' }}
        />
        <p
          className="absolute bottom-3 left-0 right-0 text-center text-xs text-stone-300 pointer-events-none select-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          drag anything
        </p>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mt-3 px-1 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={toggleGravity}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              backgroundColor: gravity ? 'rgba(26,25,22,0.09)' : 'rgba(26,25,22,0.04)',
              color: gravity ? '#1a1916' : '#78716c',
            }}
          >
            {gravity ? 'gravity on' : 'zero-g'}
          </button>
          <button
            onClick={chaos}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', backgroundColor: 'rgba(26,25,22,0.04)', color: '#78716c' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(26,25,22,0.09)'; e.currentTarget.style.color = '#1a1916' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(26,25,22,0.04)'; e.currentTarget.style.color = '#78716c' }}
          >
            chaos
          </button>
        </div>
        <Link
          href="/playground"
          className="text-xs text-stone-400 hover:text-stone-800 transition-colors"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          open full playground →
        </Link>
      </div>
    </div>
  )
}

// ─── Architect Canvas ─────────────────────────────────────────────────────────
// Free-form drag/resize canvas that activates when Architect Mode is on.
// All stat cards and action buttons become independently positionable and resizable.

type ArchCardId = 'level' | 'score' | 'streak' | 'tasks' | 'total-xp' | 'next-level' | 'timer' | 'note'
type ArchLayout = Record<ArchCardId, CardBounds>

const ARCH_DEFAULT: ArchLayout = {
  'level':      { x: 24,  y: 24,  w: 240, h: 162 },
  'score':      { x: 280, y: 24,  w: 240, h: 162 },
  'streak':     { x: 536, y: 24,  w: 240, h: 162 },
  'tasks':      { x: 24,  y: 202, w: 240, h: 162 },
  'total-xp':   { x: 280, y: 202, w: 240, h: 162 },
  'next-level': { x: 536, y: 202, w: 240, h: 162 },
  'timer':      { x: 280, y: 380, w: 240, h: 72  },
  'note':       { x: 536, y: 380, w: 240, h: 72  },
}

const ARCH_KEY = 'maable-arch-canvas'

function ArchitectCanvas({
  stats,
  onModal,
}: {
  stats: DashboardClientProps['stats']
  onModal: (m: 'note' | 'timer') => void
}) {
  const [layout, setLayout] = useState<ArchLayout>(ARCH_DEFAULT)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ARCH_KEY)
      if (saved) setLayout(prev => ({ ...prev, ...(JSON.parse(saved) as Partial<ArchLayout>) }))
    } catch { /* ignore */ }
  }, [])

  const update = useCallback((id: string, bounds: CardBounds) => {
    setLayout(prev => {
      const next = { ...prev, [id as ArchCardId]: bounds }
      try { localStorage.setItem(ARCH_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const canvasH = Math.max(...Object.values(layout).map(b => b.y + b.h + 60), 540)

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100dvh - 4.5rem)',
        overflow: 'auto',
        scrollbarWidth: 'none',
        backgroundColor: 'var(--paper, #fff)',
      }}
    >
      <div style={{ position: 'relative', minWidth: 820, minHeight: canvasH }}>

        {/* Dot-grid guide */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
          width="100%"
          height="100%"
        >
          <defs>
            <pattern id="arch-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(26,25,22,0.08)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arch-dots)" />
        </svg>

        <DragResizeCard id="level" bounds={layout.level} onBoundsChange={update} minW={160} minH={110}>
          <LevelCard level={stats.level} levelXp={stats.levelXp} />
        </DragResizeCard>

        <DragResizeCard id="score" bounds={layout.score} onBoundsChange={update} minW={160} minH={110}>
          <ScoreCard score={stats.weeklyScore} />
        </DragResizeCard>

        <DragResizeCard id="streak" bounds={layout.streak} onBoundsChange={update} minW={160} minH={110}>
          <StreakCard days={stats.streakDays} active={stats.streakActive} />
        </DragResizeCard>

        <DragResizeCard id="tasks" bounds={layout.tasks} onBoundsChange={update} minW={160} minH={110}>
          <TasksCard count={stats.tasksCompleted} xpEarned={stats.weeklyScore} />
        </DragResizeCard>

        <DragResizeCard id="total-xp" bounds={layout['total-xp']} onBoundsChange={update} minW={160} minH={110}>
          <TotalXpCard totalXp={stats.totalXp} />
        </DragResizeCard>

        <DragResizeCard id="next-level" bounds={layout['next-level']} onBoundsChange={update} minW={160} minH={110}>
          <NextLevelCard levelXp={stats.levelXp} />
        </DragResizeCard>

        <DragResizeCard id="timer" bounds={layout.timer} onBoundsChange={update} minW={160} minH={60}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <QuickActionCard
            icon={<img src="/illustrations/icon-timer.png" alt="" className="w-7 h-7 object-contain" draggable={false} />}
            label="Quick timer"
            onClick={() => onModal('timer')}
          />
        </DragResizeCard>

        <DragResizeCard id="note" bounds={layout.note} onBoundsChange={update} minW={160} minH={60}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <QuickActionCard
            icon={<img src="/illustrations/icon-calendar.png" alt="" className="w-7 h-7 object-contain" draggable={false} />}
            label="Quick note"
            onClick={() => onModal('note')}
          />
        </DragResizeCard>

        <DragResizeCard id="quick-task" bounds={{ x: 20, y: 440, w: 220, h: 60 }} onBoundsChange={update} minW={160} minH={60}>
          <QuickAddTaskCard />
        </DragResizeCard>
      </div>

      {/* Hint */}
      <p
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '0.72rem',
          color: 'rgba(26,25,22,0.18)',
          pointerEvents: 'none',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        drag ··· to move · drag corners ◻ to resize
      </p>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardClient({ profile, stats }: DashboardClientProps) {
  const displayName = profile?.display_name ?? 'User'
  const [modal, setModal] = useState<'note' | 'timer' | null>(null)
  const { sectionOrder, hiddenSections, architectMode } = useArchitect()
  const { adhdMode } = useADHD()

  const archBorder = architectMode ? '2px dashed rgba(99,102,241,0.30)' : 'none'

  const sectionStats = !hiddenSections.has('stats') && (
    <section
      key="stats"
      className="flex relative"
      style={{
        height: 'calc(100dvh - 4.5rem)', overflow: 'hidden',
        outline: archBorder, outlineOffset: -4,
      }}
    >
      {architectMode && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px]"
          style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontFamily: 'Georgia, serif' }}>
          stats &amp; level
        </div>
      )}
      {/* Left — avatar */}
      <div
        className="flex flex-col"
        style={{ width: '44%', height: '100%', paddingLeft: '3.5rem', paddingTop: '1.75rem', paddingBottom: '1.75rem' }}
      >
        <p className="text-sm text-stone-400 shrink-0 mb-3" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {displayName}
        </p>
        <motion.div
          className="flex-1 min-h-0"
          animate={adhdMode ? { rotate: [0, -1, 1, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/avatar-user.png"
            alt={displayName}
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </motion.div>
        <p className="mt-3 text-xl text-stone-800 shrink-0" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          ....
        </p>
      </div>

      {/* Right — stat cards */}
      <div className="flex-1 flex flex-col justify-center pr-10 pl-5 gap-4">
        <div className="grid grid-cols-3 gap-4">
          <LevelCard   level={stats.level}   levelXp={stats.levelXp} />
          <ScoreCard   score={stats.weeklyScore} />
          <StreakCard  days={stats.streakDays}  active={stats.streakActive} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <TasksCard    count={stats.tasksCompleted} xpEarned={stats.weeklyScore} />
          <TotalXpCard  totalXp={stats.totalXp} />
          <NextLevelCard levelXp={stats.levelXp} />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <NowPlayingCard />
          <QuickAddTaskCard />
          <QuickActionCard
            icon={<img src="/illustrations/icon-timer.png" alt="" className="w-7 h-7 object-contain" draggable={false} />}
            label="Quick timer"
            onClick={() => setModal('timer')}
          />
          <QuickActionCard
            icon={<img src="/illustrations/icon-calendar.png" alt="" className="w-7 h-7 object-contain" draggable={false} />}
            label="Quick note"
            onClick={() => setModal('note')}
          />
        </div>
      </div>
    </section>
  )

  const sectionLifeAreas = !hiddenSections.has('life-areas') && (
    <section
      key="life-areas"
      className="relative"
      style={{
        padding: '3rem 3rem 4rem',
        borderTop: '1px solid rgba(26,25,22,0.07)',
        backgroundColor: 'var(--paper-warm, #faf9f7)',
        outline: archBorder, outlineOffset: -4,
      }}
    >
      {architectMode && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px]"
          style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontFamily: 'Georgia, serif' }}>
          life areas
        </div>
      )}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-xs text-stone-400 mb-1.5" style={{ letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            your world
          </p>
          <h2 className="text-3xl text-stone-900 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Where are you headed today?
          </h2>
        </div>
        <p className="text-xs text-stone-300" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>5 life areas</p>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '220px 220px' }}>
        <div style={{ gridColumn: '1', gridRow: '1 / 3', display: 'flex', flexDirection: 'column' }}>
          <CategoryBentoCard id="career" delay={0} fontSize={18} />
        </div>
        <CategoryBentoCard id="student" delay={0.07} />
        <CategoryBentoCard id="hobbies" delay={0.13} />
        <CategoryBentoCard id="reading" delay={0.19} />
        <CategoryBentoCard id="lazy" delay={0.25} />
      </div>
    </section>
  )

  const sectionPlayground = !hiddenSections.has('playground') && (
    <section
      key="playground"
      className="flex flex-col relative"
      style={{
        padding: '3rem 3rem 4rem',
        borderTop: '1px solid rgba(26,25,22,0.07)',
        backgroundColor: 'var(--paper-warm, #faf9f7)',
        outline: archBorder, outlineOffset: -4,
      }}
    >
      {architectMode && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px]"
          style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontFamily: 'Georgia, serif' }}>
          playground
        </div>
      )}
      <div className="flex items-end justify-between mb-5 shrink-0">
        <div>
          <p className="text-xs text-stone-400 mb-1.5" style={{ letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            break time
          </p>
          <h2 className="text-3xl text-stone-900 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            The Playground
          </h2>
        </div>
        <p className="text-xs text-stone-300" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>physics sandbox</p>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <MiniPlayground />
      </div>
    </section>
  )

  const sectionMap = { 'stats': sectionStats, 'life-areas': sectionLifeAreas, 'playground': sectionPlayground }

  // Architect mode: replace everything with free-form canvas
  if (architectMode) {
    return (
      <>
        <ArchitectCanvas stats={stats} onModal={m => setModal(m)} />
        <AnimatePresence>
          {modal === 'note'  && <QuickNoteModal  onClose={() => setModal(null)} />}
          {modal === 'timer' && <QuickTimerModal onClose={() => setModal(null)} />}
        </AnimatePresence>
      </>
    )
  }

  return (
    <div
      style={{
        height: 'calc(100dvh - 4.5rem)',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
        backgroundColor: '#ffffff',
      }}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {/* ADHD mode — subtle animated ink top line */}
      {adhdMode && (
        <div style={{
          position: 'sticky', top: 0, left: 0, right: 0, height: 2, zIndex: 10,
          background: 'linear-gradient(90deg, rgba(26,25,22,0.12), #c9a84c88, rgba(26,25,22,0.08), #c9a84c44, rgba(26,25,22,0.12))',
          backgroundSize: '300% 100%',
          animation: 'adhd-slide 3s linear infinite',
        }} />
      )}

      <AnimatePresence mode="popLayout">
        {sectionOrder.map(id => {
          const el = sectionMap[id]
          if (!el) return null
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {el}
            </motion.div>
          )
        })}
      </AnimatePresence>

      <AnimatePresence>
        {modal === 'note'  && <QuickNoteModal  onClose={() => setModal(null)} />}
        {modal === 'timer' && <QuickTimerModal onClose={() => setModal(null)} />}
      </AnimatePresence>

      <LevelUpEffect level={stats.level} />
    </div>
  )
}
