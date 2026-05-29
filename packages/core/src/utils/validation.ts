/**
 * Input validation utilities — used at API boundaries.
 * Keep these pure (no side effects) so they work on both web and mobile.
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUsername(username: string): boolean {
  // 3-30 chars, alphanumeric + underscores, no leading/trailing underscore
  return /^[a-zA-Z0-9][a-zA-Z0-9_]{1,28}[a-zA-Z0-9]$/.test(username)
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  )
}

export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}
