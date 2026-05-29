'use client'

import { motion } from 'framer-motion'

interface XpBarProps {
  level: number
  xp: number
  compact?: boolean
}

export function XpBar({ level, xp, compact = false }: XpBarProps) {
  const xpInLevel = xp - (level - 1) * 1000
  const progress = Math.min(xpInLevel / 1000, 1)
  const toNext = 1000 - xpInLevel

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-xs text-stone-500"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Lv.{level}
          </span>
          <span className="text-[11px] text-stone-300">
            {toNext.toLocaleString()} xp to Lv.{level + 1}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden" style={{ backgroundColor: 'rgba(26,25,22,0.07)' }}>
          <motion.div
            className="h-full"
            style={{ backgroundColor: '#1a1916' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.15 }}
          />
        </div>
        <p className="text-[11px] text-stone-300 mt-1">
          {xpInLevel.toLocaleString()} / 1,000 xp
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm text-stone-700"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Level {level}
        </span>
        <span className="text-xs text-stone-400">
          {toNext.toLocaleString()} xp to next
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'rgba(26,25,22,0.07)' }}>
        <motion.div
          className="h-full"
          style={{ backgroundColor: '#1a1916' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.2 }}
        />
      </div>
      <p className="text-xs text-stone-400 mt-1.5">
        {xpInLevel.toLocaleString()} / 1,000 xp this level
      </p>
    </div>
  )
}
