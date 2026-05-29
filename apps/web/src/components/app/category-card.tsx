'use client'

import { motion } from 'framer-motion'
import type { Profile } from '@maable/core'

export type LifeCategory = 'career' | 'student' | 'hobbies' | 'reading' | 'lazy'

interface CategoryCardProps {
  category: LifeCategory
  label: string
  isFocused: boolean
  isAnyFocused: boolean
  onFocus: () => void
  onBlur: () => void
  profile: Profile | null
  stats?: CategoryStats
  delay?: number
}

interface CategoryStats {
  weeklyScore: number
  tasksCompleted: number
  tasksTotal: number
  streakDays: number
  streakActive: boolean
}

export function CategoryCard({
  category,
  label,
  isFocused,
  isAnyFocused,
  onFocus,
  onBlur,
  profile,
  stats,
  delay = 0,
}: CategoryCardProps) {
  const isDimmed = isAnyFocused && !isFocused

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', damping: 22, stiffness: 180 }}
      onHoverStart={onFocus}
      onHoverEnd={onBlur}
      className="relative cursor-pointer select-none"
    >
      <motion.div
        animate={{
          opacity: isDimmed ? 0.35 : 1,
          scale: isDimmed ? 0.92 : isFocused ? 1.02 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        {isFocused ? (
          <FocusedCard category={category} label={label} profile={profile} {...(stats !== undefined ? { stats } : {})} />
        ) : (
          <DefaultCard category={category} label={label} />
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Default (resting) card ───────────────────────────────────────────────────

function DefaultCard({ category, label }: { category: LifeCategory; label: string }) {
  return (
    <div className="flex flex-col items-center pb-4">
      {/* Illustration area */}
      <div className="w-44 h-44 flex items-end justify-center">
        <CategoryIllustration category={category} />
      </div>
      <p
        className="mt-3 text-base text-stone-700"
        style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}
      >
        {label}
      </p>
      {/* Underline */}
      <div className="mt-2 w-full h-px bg-stone-200" />
    </div>
  )
}

// ─── Focused (hover) card ─────────────────────────────────────────────────────

function FocusedCard({
  profile,
  stats,
}: {
  category: LifeCategory
  label: string
  profile: Profile | null
  stats?: CategoryStats
}) {
  const displayName = profile?.display_name ?? 'User'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-start gap-8 py-4"
    >
      {/* Left: user chibi + name */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-52 h-52">
          <UserChibiIllustration />
        </div>
        <p className="mt-2 text-sm text-stone-500">{displayName}</p>
        <p
          className="mt-1 text-base text-stone-700"
          style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}
        >
          Maable
        </p>
      </div>

      {/* Right: stats grid + quick actions */}
      <div className="flex-1 space-y-3 pt-6">
        {/* Stats grid — 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Weekly score"
            value={stats ? `${stats.weeklyScore} pts` : '— pts'}
          />
          <StatCard label="Maable" value="—" />
          <StatCard label="Maable" value="—" />
          <StatCard
            label="Task completed"
            value={stats ? `${stats.tasksCompleted}/${stats.tasksTotal}` : '—'}
          />
          <StatCard
            label="Current Streak"
            value={stats?.streakActive ? 'Streak Active' : '—'}
          />
          <StatCard label="Maable" value="—" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <QuickAction
            icon={<img src="/illustrations/icon-timer.png" alt="" className="w-5 h-5 object-contain" draggable={false} />}
            label="Quick timer"
          />
          <QuickAction
            icon={<img src="/illustrations/icon-calendar.png" alt="" className="w-5 h-5 object-contain" draggable={false} />}
            label="Quick note"
          />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stone-200 rounded-lg px-3 py-2.5 bg-white/60">
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 w-2 h-2 rounded-full bg-stone-800 shrink-0" />
        <div>
          <p className="text-xs text-stone-500 leading-tight">{label}</p>
          <p className="text-xs font-medium text-stone-800 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2.5 bg-white/60 hover:bg-stone-50 transition-colors text-stone-600 hover:text-stone-900">
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  )
}

// ─── Illustrations ────────────────────────────────────────────────────────────

const CATEGORY_IMAGES: Record<LifeCategory, string> = {
  career: '/illustrations/category-career.png',
  student: '/illustrations/category-student.png',
  hobbies: '/illustrations/category-hobbies.png',
  reading: '/illustrations/category-reading.png',
  lazy: '/illustrations/category-lazy.png',
}

function CategoryIllustration({ category }: { category: LifeCategory }) {
  return (
    <img
      src={CATEGORY_IMAGES[category]}
      alt={category}
      className="w-full h-full object-contain"
      draggable={false}
    />
  )
}

function UserChibiIllustration() {
  return (
    <img
      src="/illustrations/avatar-user.png"
      alt="User avatar"
      className="w-full h-full object-contain"
      draggable={false}
    />
  )
}
