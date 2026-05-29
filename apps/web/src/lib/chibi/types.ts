// ─── Intents ──────────────────────────────────────────────────────────────────

export type Intent =
  | { type: 'navigate';     page: AppPage }
  | { type: 'open_notes';   subject: string }
  | { type: 'revise';       subject: string }
  | { type: 'tasks_query';  filter: 'today' | 'urgent' | 'all' | 'overdue' }
  | { type: 'habit_query' }
  | { type: 'xp_query' }
  | { type: 'motivation' }
  | { type: 'lazy' }
  | { type: 'timer';        minutes: number }
  | { type: 'unknown';      text: string }

export type AppPage =
  | 'tasks' | 'habits' | 'notes' | 'schedule' | 'leaderboard'
  | 'connect' | 'student' | 'career' | 'hobbies' | 'lazy'
  | 'reading' | 'profile' | 'settings' | 'dashboard'

// ─── Actions (sent back to client to execute) ─────────────────────────────────

export type ChibiAction =
  | { type: 'navigate';  href: string }
  | { type: 'open_notes'; href: string; title: string }
  | { type: 'revise';    cards: RevisionCard[]; subject: string }
  | { type: 'lazy_mode' }
  | { type: 'timer';     minutes: number }

export interface RevisionCard {
  prompt: string
  answer: string
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface ChibiResponse {
  text: string
  action?: ChibiAction
}

// ─── User context (passed from server) ────────────────────────────────────────

export interface UserContext {
  name: string
  level: number
  xp: number
  tasks: ContextTask[]
  habits: ContextHabit[]
  notes: ContextNote[]
}

export interface ContextTask {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
}

export interface ContextHabit {
  id: string
  title: string
  current_streak: number
}

export interface ContextNote {
  id: string
  title: string
  content_text: string | null
  tags: string[]
}
