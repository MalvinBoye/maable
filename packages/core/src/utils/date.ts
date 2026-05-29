/**
 * Lightweight date utilities — no heavy date library dependency.
 * All functions work with ISO 8601 strings and YYYY-MM-DD date strings.
 */

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayDate()
}

export function isOverdue(dueDateStr: string | null): boolean {
  if (!dueDateStr) return false
  return dueDateStr < todayDate()
}

export function daysUntil(dateStr: string): number {
  const today = new Date(todayDate())
  const target = new Date(dateStr)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatRelativeDate(dateStr: string): string {
  const days = daysUntil(dateStr)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  return `${Math.floor(days / 30)}mo`
}

export function isoToDisplayDate(iso: string, locale = 'en-US'): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getStartOfWeek(date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getDateRange(days: number): string[] {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}
