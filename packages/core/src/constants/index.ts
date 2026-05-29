export const APP_NAME = 'Maable'
export const APP_TAGLINE = 'Make life manageable'
export const APP_VERSION = '1.0.0'

export const SUPPORT_EMAIL = 'support@maable.app'
export const PRIVACY_POLICY_URL = 'https://maable.app/privacy'
export const TERMS_URL = 'https://maable.app/terms'

// RevenueCat product IDs
export const REVENUE_CAT = {
  PRO_MONTHLY: 'maable_pro_monthly',
  PRO_ANNUAL: 'maable_pro_annual',
  PREMIUM_MONTHLY: 'maable_premium_monthly',
  PREMIUM_ANNUAL: 'maable_premium_annual',
} as const

// Supabase storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  NOTE_ATTACHMENTS: 'note-attachments',
  SKINS: 'skins',
} as const

// Leaderboard
export const LEADERBOARD_PAGE_SIZE = 50

// Pagination
export const DEFAULT_PAGE_SIZE = 20

// Task XP by priority (matches DB defaults)
export const TASK_XP = {
  low: 10,
  medium: 25,
  high: 50,
  urgent: 75,
} as const

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365] as const

// Default skin slug (always available, no purchase needed)
export const DEFAULT_SKIN_SLUG = 'maable-classic'
