/**
 * App-level types used across web and mobile — derived from DB types
 * but shaped for UI consumption.
 */

import type { Task, Habit, Profile, LeaderboardEntry } from './database'

// ─── XP / Gamification ────────────────────────────────────────────────────────

export const XP_PER_LEVEL = 1000

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function xpProgressInLevel(xp: number): number {
  return xp % XP_PER_LEVEL
}

export function xpToNextLevel(xp: number): number {
  return XP_PER_LEVEL - xpProgressInLevel(xp)
}

export const XP_REWARDS = {
  task_complete: {
    low: 10,
    medium: 25,
    high: 50,
    urgent: 75,
  },
  habit_complete: 20,
  streak_3: 30,
  streak_7: 75,
  streak_14: 150,
  streak_30: 300,
  note_created: 5,
  daily_login: 15,
} as const

// ─── Feature flags by subscription tier ──────────────────────────────────────

export const TIER_LIMITS = {
  free: {
    max_projects: 3,
    max_tasks_per_project: 25,
    max_habits: 5,
    max_notes: 50,
    integrations: [] as string[],
    leaderboard_scope: 'global' as const,
    custom_skins: false,
  },
  pro: {
    max_projects: 20,
    max_tasks_per_project: 500,
    max_habits: 20,
    max_notes: 1000,
    integrations: ['canvas', 'managebac'] as string[],
    leaderboard_scope: 'friends' as const,
    custom_skins: true,
  },
  premium: {
    max_projects: Infinity,
    max_tasks_per_project: Infinity,
    max_habits: Infinity,
    max_notes: Infinity,
    integrations: ['canvas', 'managebac', 'linkedin', 'google_calendar'] as string[],
    leaderboard_scope: 'friends' as const,
    custom_skins: true,
  },
} as const

// ─── UI-shaped types ──────────────────────────────────────────────────────────

export interface TaskWithProject extends Task {
  project?: { id: string; title: string; color: string } | null
}

export interface HabitWithStats extends Habit {
  completed_today: boolean
  completion_rate_7d: number // 0-1
}

export interface ProfileWithStats extends Profile {
  xp_this_week: number
  tasks_completed_this_week: number
  habits_completed_today: number
  friends_count: number
}

export interface LeaderboardWithFriendship extends LeaderboardEntry {
  is_friend: boolean
  is_self: boolean
}

// ─── Navigation / routing ─────────────────────────────────────────────────────

export type RootStackParamList = {
  '(auth)': undefined
  '(app)': undefined
}

export type AuthStackParamList = {
  welcome: undefined
  login: undefined
  signup: undefined
  'forgot-password': undefined
}

export type AppTabParamList = {
  home: undefined
  tasks: undefined
  habits: undefined
  notes: undefined
  leaderboard: undefined
  profile: undefined
}

// ─── API response wrappers ────────────────────────────────────────────────────

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

// ─── Theme / Skin ─────────────────────────────────────────────────────────────

export interface SkinTheme {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textMuted: string
    border: string
    success: string
    warning: string
    error: string
    xpBar: string
  }
  borderRadius: {
    sm: number
    md: number
    lg: number
    xl: number
    full: number
  }
  animations: {
    taskComplete: string // animation name/id
    habitComplete: string
    levelUp: string
    xpGain: string
  }
  sounds: {
    taskComplete: string | null
    habitComplete: string | null
    levelUp: string | null
    buttonTap: string | null
  }
}
