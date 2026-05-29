import type { Intent, AppPage } from './types'

// ─── Page aliases ─────────────────────────────────────────────────────────────

const PAGE_ALIASES: Record<AppPage, string[]> = {
  tasks:       ['tasks', 'task', 'to-do', 'todo', 'to do'],
  habits:      ['habits', 'habit', 'streak', 'streaks', 'routines'],
  notes:       ['notes', 'note'],
  schedule:    ['schedule', 'calendar', 'planner', 'timetable', 'day plan'],
  leaderboard: ['leaderboard', 'ranking', 'rankings', 'league', 'competition'],
  connect:     ['connect', 'integrations', 'integration', 'canvas', 'linkedin'],
  student:     ['student', 'assignments', 'assignment', 'school', 'uni', 'college', 'homework'],
  career:      ['career', 'jobs', 'job', 'work', 'professional'],
  hobbies:     ['hobbies', 'hobby'],
  lazy:        ['lazy', 'laziness', 'chill', 'relax', 'break', 'rest'],
  reading:     ['reading', 'read', 'books', 'library'],
  profile:     ['profile', 'account', 'me', 'my account'],
  settings:    ['settings', 'setting', 'preferences', 'config'],
  dashboard:   ['dashboard', 'home', 'overview'],
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

const NAVIGATE_TRIGGERS = [
  /^(?:go\s+to|open|take\s+me\s+to|navigate\s+to|show\s+me|switch\s+to|jump\s+to)\s+(.+)/i,
  /^(.+)\s+(?:page|section|tab)$/i,
]

const OPEN_NOTES_TRIGGERS = [
  /open\s+(?:my\s+)?(.+?)\s+notes?/i,
  /show\s+(?:my\s+)?(.+?)\s+notes?/i,
  /(?:find|get)\s+(?:my\s+)?(.+?)\s+notes?/i,
  /(?:my\s+)?(.+?)\s+notes?\s+please/i,
  /notes?\s+(?:for|about|on)\s+(.+)/i,
]

const REVISE_TRIGGERS = [
  /help\s+me\s+revise\s+(?:for\s+)?(.+)/i,
  /revise\s+(?:for\s+)?(.+)/i,
  /quiz\s+me\s+(?:on\s+)?(.+)/i,
  /test\s+me\s+(?:on\s+)?(.+)/i,
  /revision\s+(?:for\s+|mode\s+for\s+)?(.+)/i,
  /study\s+(?:for\s+)?(.+)\s+with\s+me/i,
  /flashcards?\s+(?:for\s+|on\s+)?(.+)/i,
  /prepare\s+(?:me\s+)?for\s+(.+)/i,
  /practice\s+(?:for\s+)?(.+)/i,
]

const TASKS_TODAY = [/what(?:'s|\s+is)\s+due\s+today/i, /today(?:'s)?\s+tasks?/i, /what\s+do\s+i\s+have\s+today/i, /due\s+today/i]
const TASKS_URGENT = [/urgent\s+tasks?/i, /what(?:'s|\s+is)\s+urgent/i, /priority\s+tasks?/i, /what\s+needs\s+doing/i]
const TASKS_ALL = [/show\s+(?:me\s+)?(?:my\s+)?(?:all\s+)?tasks?/i, /what(?:'s|\s+are)\s+(?:my\s+)?tasks?/i, /list\s+(?:my\s+)?tasks?/i]
const TASKS_OVERDUE = [/overdue/i, /late\s+tasks?/i, /missed\s+deadlines?/i, /past\s+due/i]

const HABIT_TRIGGERS = [/how(?:'s|\s+is)\s+(?:my\s+)?streak/i, /(?:my\s+)?habits?/i, /streak/i, /how\s+(?:am\s+)?i\s+doing\s+with\s+(?:my\s+)?habits?/i]
const XP_TRIGGERS = [/(?:my\s+)?(?:xp|experience\s+points?|level)/i, /how\s+(?:much\s+)?xp/i, /what\s+level\s+am\s+i/i, /how\s+far\s+(?:am\s+i|to\s+(?:next\s+)?level)/i]
const MOTIVATION_TRIGGERS = [/motivat/i, /i\s+(?:can't|cannot|dont|don't)\s+(?:do\s+)?this/i, /i\s+(?:give\s+up|quit)/i, /help\s+me\s+start/i, /i(?:'m|\s+am)\s+(?:struggling|stuck|overwhelmed)/i, /where\s+do\s+i\s+start/i, /how\s+do\s+i\s+begin/i, /i\s+(?:need|want)\s+motivation/i]
const LAZY_TRIGGERS = [/i(?:'m|\s+am)\s+(?:tired|exhausted|drained|feeling\s+lazy|procrastinating)/i, /i\s+(?:don't|dont)\s+(?:want\s+to\s+do\s+anything|feel\s+like\s+it)/i, /can(?:'t|\s+not)\s+be\s+bothered/i, /need\s+a\s+break/i, /i(?:'m|\s+am)\s+burnt?\s*out/i]

// ─── detectIntent ─────────────────────────────────────────────────────────────

export function detectIntent(raw: string): Intent {
  const s = raw.trim()

  // Timer
  const timerMatch = s.match(/(\d+)\s*(?:minute|min)s?\s*timer/i) ?? s.match(/timer\s*(?:for\s+)?(\d+)/i)
  if (timerMatch ?? /pomodoro/i.test(s)) {
    const minutes = timerMatch ? parseInt(timerMatch[1] ?? '25', 10) : 25
    return { type: 'timer', minutes }
  }

  // Revision
  for (const rx of REVISE_TRIGGERS) {
    const m = s.match(rx)
    if (m) return { type: 'revise', subject: cleanSubject(m[1] ?? '') }
  }

  // Open notes
  for (const rx of OPEN_NOTES_TRIGGERS) {
    const m = s.match(rx)
    if (m) return { type: 'open_notes', subject: cleanSubject(m[1] ?? '') }
  }

  // Navigate
  for (const rx of NAVIGATE_TRIGGERS) {
    const m = s.match(rx)
    if (m) {
      const page = matchPage(m[1] ?? '')
      if (page) return { type: 'navigate', page }
    }
  }
  // Also check bare page names
  const barePage = matchPage(s)
  if (barePage) return { type: 'navigate', page: barePage }

  // Tasks
  if (TASKS_OVERDUE.some(rx => rx.test(s))) return { type: 'tasks_query', filter: 'overdue' }
  if (TASKS_TODAY.some(rx => rx.test(s))) return { type: 'tasks_query', filter: 'today' }
  if (TASKS_URGENT.some(rx => rx.test(s))) return { type: 'tasks_query', filter: 'urgent' }
  if (TASKS_ALL.some(rx => rx.test(s))) return { type: 'tasks_query', filter: 'all' }

  // Habits
  if (HABIT_TRIGGERS.some(rx => rx.test(s))) return { type: 'habit_query' }

  // XP/Level
  if (XP_TRIGGERS.some(rx => rx.test(s))) return { type: 'xp_query' }

  // Lazy
  if (LAZY_TRIGGERS.some(rx => rx.test(s))) return { type: 'lazy' }

  // Motivation
  if (MOTIVATION_TRIGGERS.some(rx => rx.test(s))) return { type: 'motivation' }

  return { type: 'unknown', text: s }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchPage(input: string): AppPage | null {
  const lower = input.toLowerCase().trim()
  for (const [page, aliases] of Object.entries(PAGE_ALIASES) as [AppPage, string[]][]) {
    if (aliases.some(a => lower === a || lower.includes(a))) return page
  }
  return null
}

function cleanSubject(raw: string): string {
  return raw
    .replace(/^(?:for\s+|my\s+|the\s+)/i, '')
    .replace(/\s*(?:please|now|asap)$/i, '')
    .trim()
    .toLowerCase()
}
