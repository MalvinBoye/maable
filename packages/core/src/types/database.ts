/**
 * Mirrors the Supabase DB schema exactly.
 * Generated types live here — edit with care, regenerate with `supabase gen types typescript`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived'
export type HabitFrequency = 'daily' | 'weekly' | 'custom'
export type SubscriptionTier = 'free' | 'pro' | 'premium'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
export type IntegrationProvider = 'linkedin' | 'canvas' | 'managebac' | 'google_calendar'
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'
export type XpSource =
  | 'task_complete'
  | 'habit_complete'
  | 'streak_bonus'
  | 'note_created'
  | 'daily_login'
  | 'challenge_complete'
  | 'level_up_bonus'

// ─── Tables ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string // references auth.users.id
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  subscription_tier: SubscriptionTier
  total_xp: number
  level: number
  current_skin_id: string | null
  timezone: string
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  color: string // hex color
  icon: string | null // emoji or icon name
  is_archived: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  parent_task_id: string | null // subtasks
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null // ISO 8601 date
  due_time: string | null // HH:MM
  reminder_at: string | null // ISO 8601 datetime
  tags: string[]
  xp_reward: number
  sort_order: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  user_id: string
  title: string
  description: string | null
  icon: string | null
  color: string
  frequency: HabitFrequency
  frequency_days: number[] | null // [0-6] for custom days of week
  target_count: number // completions per period
  xp_reward: number
  current_streak: number
  longest_streak: number
  is_archived: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HabitCompletion {
  id: string
  habit_id: string
  user_id: string
  completed_date: string // YYYY-MM-DD
  count: number
  note: string | null
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  project_id: string | null
  task_id: string | null
  title: string
  content: Json // Tiptap/ProseMirror JSON
  content_text: string | null // plain text for search
  tags: string[]
  is_pinned: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string // YYYY-MM-DD
  mood: number | null // 1-5
  prompt: string | null
  content: string | null
  created_at: string
  updated_at: string
}

export interface GameRoom {
  id: string
  code: string
  game: string
  host_id: string
  guest_id: string | null
  state: Json
  winner: string | null
  created_at: string
  updated_at: string
}

export interface XpTransaction {
  id: string
  user_id: string
  source: XpSource
  amount: number
  metadata: Json | null // { task_id: ..., habit_id: ..., etc. }
  created_at: string
}

export interface Skin {
  id: string
  name: string
  slug: string
  description: string | null
  preview_url: string | null
  price_credits: number // 0 = free/default
  is_default: boolean
  theme_config: Json // colors, fonts, animations config
  created_at: string
}

export interface UserSkin {
  id: string
  user_id: string
  skin_id: string
  unlocked_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  user_id: string
  provider: IntegrationProvider
  provider_user_id: string | null
  access_token_encrypted: string // AES-256 encrypted — never expose raw
  refresh_token_encrypted: string | null
  token_expires_at: string | null
  scopes: string[]
  is_active: boolean
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  platform: 'ios' | 'web' | 'android'
  provider_subscription_id: string | null // RevenueCat ID
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

// ─── Leaderboard (computed view) ──────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  total_xp: number
  level: number
  current_skin_id: string | null
  rank: number
}

// ─── Database type map ────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Omit<Profile, 'id'>> }
      projects: { Row: Project; Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Project, 'id' | 'user_id'>> }
      tasks: { Row: Task; Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Task, 'id' | 'user_id'>> }
      habits: { Row: Habit; Insert: Omit<Habit, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Habit, 'id' | 'user_id'>> }
      habit_completions: { Row: HabitCompletion; Insert: Omit<HabitCompletion, 'id' | 'created_at'>; Update: never }
      notes: { Row: Note; Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Note, 'id' | 'user_id'>> }
      xp_transactions: { Row: XpTransaction; Insert: Omit<XpTransaction, 'id' | 'created_at'>; Update: never }
      skins: { Row: Skin; Insert: Omit<Skin, 'id' | 'created_at'>; Update: Partial<Omit<Skin, 'id'>> }
      user_skins: { Row: UserSkin; Insert: Omit<UserSkin, 'id' | 'unlocked_at'>; Update: never }
      friendships: { Row: Friendship; Insert: Omit<Friendship, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Pick<Friendship, 'status'>> }
      integrations: { Row: Integration; Insert: Omit<Integration, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Integration, 'id' | 'user_id'>> }
      subscriptions: { Row: Subscription; Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Subscription, 'id' | 'user_id'>> }
    }
    Views: {
      leaderboard_global: { Row: LeaderboardEntry }
      leaderboard_friends: { Row: LeaderboardEntry & { viewer_user_id: string } }
    }
    Functions: Record<string, never>
    Enums: {
      task_priority: TaskPriority
      task_status: TaskStatus
      habit_frequency: HabitFrequency
      subscription_tier: SubscriptionTier
      subscription_status: SubscriptionStatus
      integration_provider: IntegrationProvider
      friendship_status: FriendshipStatus
      xp_source: XpSource
    }
  }
}
