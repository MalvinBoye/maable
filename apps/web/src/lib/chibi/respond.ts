import type { Intent, UserContext, ChibiResponse, ContextNote } from './types'
import { buildRevisionCards } from './revision'

// ─── Page labels + hrefs ──────────────────────────────────────────────────────

const PAGE_META: Record<string, { label: string; href: string }> = {
  tasks:       { label: 'Tasks',       href: '/tasks' },
  habits:      { label: 'Habits',      href: '/habits' },
  notes:       { label: 'Notes',       href: '/notes' },
  schedule:    { label: 'Schedule',    href: '/schedule' },
  leaderboard: { label: 'Leaderboard', href: '/leaderboard' },
  connect:     { label: 'Connect',     href: '/connect' },
  student:     { label: 'Student',     href: '/student' },
  career:      { label: 'Career',      href: '/career' },
  hobbies:     { label: 'Hobbies',     href: '/hobbies' },
  lazy:        { label: 'Lazy',        href: '/lazy' },
  reading:     { label: 'Reading',     href: '/reading' },
  profile:     { label: 'Profile',     href: '/profile' },
  settings:    { label: 'Settings',    href: '/settings' },
  dashboard:   { label: 'Dashboard',   href: '/dashboard' },
}

// ─── Motivation lines ─────────────────────────────────────────────────────────

const MOTIVATION = [
  "You don't have to feel like it. You just have to start. The feeling comes after.",
  "One thing. Just one. That's all you need to do right now.",
  "Your future self is going to thank you for doing this today.",
  "Progress beats perfection every single time. Start messy.",
  "The hardest part is always the first five minutes. You've got this.",
  "Done beats perfect. Always.",
  "You've handled harder things than this. This is just today.",
  "Small consistent actions beat occasional heroics. Do the small thing.",
]

// ─── generateResponse ─────────────────────────────────────────────────────────

export function generateResponse(intent: Intent, ctx: UserContext): ChibiResponse {
  switch (intent.type) {

    // ── Navigate ────────────────────────────────────────────────────────────
    case 'navigate': {
      const meta = PAGE_META[intent.page]
      if (!meta) return { text: `I can't find that page.` }
      return {
        text: `Taking you to ${meta.label}.`,
        action: { type: 'navigate', href: meta.href },
      }
    }

    // ── Open notes ──────────────────────────────────────────────────────────
    case 'open_notes': {
      const note = findNote(ctx.notes, intent.subject)
      if (!note) {
        return {
          text: `I couldn't find notes about "${intent.subject}". Head to Notes to create some.`,
          action: { type: 'navigate', href: '/notes' },
        }
      }
      return {
        text: `Found your ${note.title} notes. Opening them now.`,
        action: { type: 'open_notes', href: `/notes`, title: note.title },
      }
    }

    // ── Revise ──────────────────────────────────────────────────────────────
    case 'revise': {
      const note = findNote(ctx.notes, intent.subject)
      if (!note || !note.content_text?.trim()) {
        return {
          text: `I can't find notes on "${intent.subject}" to revise from. Add some notes first and I'll be able to quiz you on them.`,
          action: { type: 'navigate', href: '/notes' },
        }
      }
      const cards = buildRevisionCards(note.content_text, intent.subject)
      return {
        text: `Found ${cards.length} things to go over from your ${note.title} notes. Let's get into it.`,
        action: { type: 'revise', cards, subject: note.title },
      }
    }

    // ── Tasks ───────────────────────────────────────────────────────────────
    case 'tasks_query': {
      const today = new Date().toISOString().slice(0, 10)
      let filtered = ctx.tasks.filter(t => t.status !== 'done' && t.status !== 'archived')

      if (intent.filter === 'today') {
        filtered = filtered.filter(t => t.due_date === today)
        if (filtered.length === 0) return { text: `Nothing due today — enjoy the breathing room.`, action: { type: 'navigate', href: '/tasks' } }
        return {
          text: `Today you've got:\n${filtered.map(t => `• ${t.title}`).join('\n')}`,
          action: { type: 'navigate', href: '/tasks' },
        }
      }

      if (intent.filter === 'overdue') {
        filtered = filtered.filter(t => t.due_date && t.due_date < today)
        if (filtered.length === 0) return { text: `Nothing overdue — you're on top of it.` }
        return {
          text: `${filtered.length} overdue task${filtered.length > 1 ? 's' : ''}:\n${filtered.slice(0, 5).map(t => `• ${t.title} (was due ${t.due_date})`).join('\n')}`,
          action: { type: 'navigate', href: '/tasks' },
        }
      }

      if (intent.filter === 'urgent') {
        filtered = filtered.filter(t => t.priority === 'urgent')
        if (filtered.length === 0) return { text: `No urgent tasks right now. Nice.` }
        return {
          text: `Urgent:\n${filtered.slice(0, 5).map(t => `• ${t.title}`).join('\n')}`,
          action: { type: 'navigate', href: '/tasks' },
        }
      }

      if (filtered.length === 0) return { text: `No open tasks. Either you're crushing it or you haven't added anything yet.`, action: { type: 'navigate', href: '/tasks' } }
      return {
        text: `You've got ${filtered.length} open task${filtered.length > 1 ? 's' : ''}. ${filtered.filter(t => t.priority === 'urgent').length > 0 ? `${filtered.filter(t => t.priority === 'urgent').length} urgent.` : ''}`,
        action: { type: 'navigate', href: '/tasks' },
      }
    }

    // ── Habits ──────────────────────────────────────────────────────────────
    case 'habit_query': {
      if (ctx.habits.length === 0) return { text: `No habits set up yet. Go add some — streaks are genuinely motivating.`, action: { type: 'navigate', href: '/habits' } }
      const best = [...ctx.habits].sort((a, b) => b.current_streak - a.current_streak)[0]
      const lines = ctx.habits.map(h => `• ${h.title}: ${h.current_streak} day${h.current_streak !== 1 ? 's' : ''}`)
      return {
        text: `${best ? `Best streak: ${best.title} at ${best.current_streak} day${best.current_streak !== 1 ? 's' : ''}.` : ''}\n${lines.join('\n')}`,
        action: { type: 'navigate', href: '/habits' },
      }
    }

    // ── XP ──────────────────────────────────────────────────────────────────
    case 'xp_query': {
      const xpInLevel = ctx.xp - (ctx.level - 1) * 1000
      const toNext = 1000 - xpInLevel
      return {
        text: `You're level ${ctx.level} with ${ctx.xp.toLocaleString()} XP total. ${toNext} XP until level ${ctx.level + 1}.`,
      }
    }

    // ── Motivation ──────────────────────────────────────────────────────────
    case 'motivation': {
      const line = MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)] ?? MOTIVATION[0]!
      const urgentCount = ctx.tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length
      const extra = urgentCount > 0 ? ` You've got ${urgentCount} urgent task${urgentCount > 1 ? 's' : ''} — start with the smallest one.` : ''
      return { text: line + extra }
    }

    // ── Lazy ────────────────────────────────────────────────────────────────
    case 'lazy': {
      return {
        text: `That's what the Lazy page is for. Pick a mode — flight timer, 5 minutes, body reset. Rest intentionally.`,
        action: { type: 'lazy_mode' },
      }
    }

    // ── Timer ───────────────────────────────────────────────────────────────
    case 'timer': {
      return {
        text: `Setting a ${intent.minutes} minute timer. Head to Lazy → 5 Minute Mode for the full thing.`,
        action: { type: 'timer', minutes: intent.minutes },
      }
    }

    // ── Unknown ─────────────────────────────────────────────────────────────
    case 'unknown': {
      return { text: buildUnknownResponse(intent.text, ctx) }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findNote(notes: ContextNote[], subject: string): ContextNote | null {
  const s = subject.toLowerCase()
  // Exact title match first
  const exact = notes.find(n => n.title.toLowerCase() === s)
  if (exact) return exact
  // Title contains subject
  const partial = notes.find(n => n.title.toLowerCase().includes(s))
  if (partial) return partial
  // Tags contain subject
  const tagged = notes.find(n => n.tags.some(t => t.toLowerCase().includes(s)))
  if (tagged) return tagged
  // Content mentions subject (broad fallback)
  const mentioned = notes.find(n => n.content_text?.toLowerCase().includes(s))
  if (mentioned) return mentioned
  return null
}

function buildUnknownResponse(_text: string, ctx: UserContext): string {
  // Friendly fallback with relevant nudges based on context
  const hour = new Date().getHours()
  const urgent = ctx.tasks.filter(t => t.priority === 'urgent' && t.status !== 'done')
  const today = new Date().toISOString().slice(0, 10)
  const dueToday = ctx.tasks.filter(t => t.due_date === today && t.status !== 'done')

  if (urgent.length > 0) {
    return `Not sure about that one. By the way — you've got ${urgent.length} urgent task${urgent.length > 1 ? 's' : ''} sitting there. Just saying.`
  }
  if (dueToday.length > 0) {
    return `Didn't quite get that. You do have ${dueToday.length} thing${dueToday.length > 1 ? 's' : ''} due today if you need a nudge.`
  }
  if (hour < 10) {
    return `Morning. Not sure what you mean — try "open my [subject] notes" or "help me revise for [subject]".`
  }
  if (hour > 22) {
    return `Getting late. Try something like "what's due today", "open my maths notes", or "help me revise for biology".`
  }
  return `Not sure I caught that. Try:\n• "open my [subject] notes"\n• "help me revise for [subject]"\n• "what's due today"\n• "show urgent tasks"`
}
