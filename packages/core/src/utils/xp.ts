import { XP_PER_LEVEL, XP_REWARDS } from '../types/app'
import { STREAK_MILESTONES } from '../constants'
import type { TaskPriority } from '../types/database'

export function calculateTaskXp(priority: TaskPriority): number {
  return XP_REWARDS.task_complete[priority]
}

export function calculateStreakBonusXp(streak: number): number {
  const milestones = [...STREAK_MILESTONES].sort((a, b) => b - a)
  const hit = milestones.find((m) => streak === m)
  if (!hit) return 0

  const bonusMap: Record<number, number> = {
    3: XP_REWARDS.streak_3,
    7: XP_REWARDS.streak_7,
    14: XP_REWARDS.streak_14,
    30: XP_REWARDS.streak_30,
  }
  // For longer streaks not in the map, scale up
  return bonusMap[hit] ?? hit * 10
}

export function totalXpForLevel(level: number): number {
  return (level - 1) * XP_PER_LEVEL
}

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function xpProgress(xp: number): { level: number; current: number; required: number; percent: number } {
  const level = levelForXp(xp)
  const current = xp % XP_PER_LEVEL
  const required = XP_PER_LEVEL
  const percent = Math.min((current / required) * 100, 100)
  return { level, current, required, percent }
}

export function didLevelUp(xpBefore: number, xpAfter: number): boolean {
  return levelForXp(xpAfter) > levelForXp(xpBefore)
}
