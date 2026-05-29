'use client'

import { useState, useEffect, useTransition } from 'react'

// MusicKit JS global type stub
declare global {
  interface Window {
    MusicKit?: {
      configure(config: { developerToken: string; app: { name: string; build: string } }): Promise<void>
      getInstance(): { authorize(): Promise<void> }
    }
  }
}
import { motion, AnimatePresence } from 'framer-motion'
import {
  connectCanvas,
  disconnectIntegration,
  triggerCanvasSync,
  type ConnectedIntegration,
} from './actions'
import { SetupGuideModal } from './setup-guide'

// ─── Integration definitions ──────────────────────────────────────────────────

const INTEGRATIONS = [
  // ── Students ─────────────────────────────────────────────────────────────────
  {
    id: 'canvas',
    group: 'student' as const,
    name: 'Canvas LMS',
    monogram: 'C',
    color: '#e66000',
    tagline: 'Bring your coursework into Maable',
    description: 'Connect your university Canvas account to pull assignments, due dates, and course schedules directly into your Maable planner and task list.',
    features: ['Assignments → Tasks', 'Due dates auto-imported', 'Priority by deadline', 'Course tags'],
    status: 'available' as const,
    connectType: 'pat' as const,
    fields: [
      { key: 'url',   label: 'Canvas URL',     placeholder: 'canvas.youruni.edu',           type: 'text'     },
      { key: 'token', label: 'Access Token',   placeholder: 'Paste your access token here',  type: 'password' },
    ],
    helpText: 'Canvas → Account → Settings → New Access Token. Name it "Maable", leave Expires blank.',
  },
  {
    id: 'google-classroom',
    group: 'student' as const,
    name: 'Google Classroom',
    monogram: 'GC',
    color: '#4285f4',
    tagline: 'Sync classes and assignments',
    description: 'Pull assignments, class announcements, and schedules from Google Classroom into Maable.',
    features: ['Assignments → Tasks', 'Class schedule', 'Announcements', 'Drive files'],
    status: 'soon' as const,
    connectType: 'oauth' as const,
  },
  {
    id: 'duolingo',
    group: 'student' as const,
    name: 'Duolingo',
    monogram: 'Dl',
    color: '#58cc02',
    tagline: 'Keep your streak alive in Maable',
    description: 'Surface your Duolingo streak and XP as a Maable habit. Never miss a day because you forgot.',
    features: ['Streak → Habit', 'Daily XP sync', 'Lesson progress', 'League stats'],
    status: 'soon' as const,
    connectType: 'form' as const,
  },
  {
    id: 'anki',
    group: 'student' as const,
    name: 'Anki',
    monogram: 'Ak',
    color: '#2196f3',
    tagline: 'Import Anki decks as Maable flashcards',
    description: 'Bring your existing Anki decks into Maable\'s spaced-repetition system. One home for all your cards.',
    features: ['Deck import', 'SM-2 algorithm', 'Progress sync', 'Shared decks'],
    status: 'soon' as const,
    connectType: 'form' as const,
  },
  // ── Career ────────────────────────────────────────────────────────────────────
  {
    id: 'linkedin',
    group: 'career' as const,
    name: 'LinkedIn',
    monogram: 'in',
    color: '#0077b5',
    tagline: 'Sync your professional profile',
    description: 'Import your skills, experience, and achievements into Maable Career notes. Generate interview prep flashcards from your own history.',
    features: ['Skills → Career notes', 'Experience import', 'Job application tracker', 'Interview prep cards'],
    status: 'soon' as const,
    connectType: 'oauth' as const,
  },
  {
    id: 'github',
    group: 'career' as const,
    name: 'GitHub',
    monogram: 'GH',
    color: '#1b1f23',
    tagline: 'Log your code contributions',
    description: 'Pull your GitHub contribution graph and recent repos into Maable. Track your coding streak as a habit.',
    features: ['Contribution streak → Habit', 'Repo log → Notes', 'README → Flashcards', 'Commit activity'],
    status: 'soon' as const,
    connectType: 'oauth' as const,
  },
  {
    id: 'notion',
    group: 'career' as const,
    name: 'Notion',
    monogram: 'N',
    color: '#1a1a1a',
    tagline: 'Import your Notion pages',
    description: 'Pull Notion pages and databases into Maable Notes. Great for career journals, project docs, and meeting notes.',
    features: ['Pages → Notes', 'Databases → Tasks', 'Auto flashcard generation', 'Two-way sync'],
    status: 'soon' as const,
    connectType: 'oauth' as const,
  },
  {
    id: 'wellfound',
    group: 'career' as const,
    name: 'Wellfound',
    monogram: 'Wf',
    color: '#f05537',
    tagline: 'Track startup job applications',
    description: 'Sync your Wellfound (AngelList) job applications into Maable\'s career tracker. Never lose track of where you applied.',
    features: ['Application pipeline', 'Company research notes', 'Interview prep', 'Offer comparison'],
    status: 'soon' as const,
    connectType: 'oauth' as const,
  },
  // ── Hobbies ───────────────────────────────────────────────────────────────────
  {
    id: 'spotify',
    group: 'hobbies' as const,
    name: 'Spotify',
    monogram: 'Sp',
    color: '#1db954',
    tagline: 'See what\'s playing — on your dashboard',
    description: 'Connect Spotify to surface your now-playing track right on your Maable dashboard. Album art, progress bar, and a quick link back to the app.',
    features: ['Now Playing on dashboard', 'Album art + progress', 'One-click open in Spotify', 'Auto token refresh'],
    status: 'available' as const,
    connectType: 'oauth' as const,
  },
  {
    id: 'apple-music',
    group: 'hobbies' as const,
    name: 'Apple Music',
    monogram: '♪',
    color: '#fc3c44',
    tagline: 'See what\'s playing from Apple Music',
    description: 'Connect Apple Music via MusicKit to show your currently-playing track on the Maable dashboard. Works for any music you play through Apple Music.',
    features: ['Now Playing on dashboard', 'Album art + progress', 'MusicKit powered', 'No data leaves your device'],
    status: 'available' as const,
    connectType: 'oauth' as const,
  },
  {
    id: 'strava',
    group: 'hobbies' as const,
    name: 'Strava',
    monogram: 'St',
    color: '#fc4c02',
    tagline: 'Turn workouts into Maable habits',
    description: 'Sync your Strava activities as Maable habits. Running, cycling, swimming — all streaks in one dashboard.',
    features: ['Activities → Habits', 'Streak tracking', 'Personal records', 'Goal progress'],
    status: 'soon' as const,
    connectType: 'oauth' as const,
  },
  {
    id: 'goodreads',
    group: 'hobbies' as const,
    name: 'Goodreads',
    monogram: 'Gr',
    color: '#553b08',
    tagline: 'Track reading and generate book notes',
    description: 'Import your reading list from Goodreads. Generate book-summary notes and flashcards from your highlights.',
    features: ['Reading list → Notes', 'Highlights → Flashcards', 'Reading habit tracking', 'Book ratings log'],
    status: 'soon' as const,
    connectType: 'form' as const,
  },
  {
    id: 'steam',
    group: 'hobbies' as const,
    name: 'Steam',
    monogram: 'Stm',
    color: '#1b2838',
    tagline: 'Log your gaming sessions',
    description: 'Pull your Steam playtime and achievements into Maable. Track gaming as a habit without the guilt.',
    features: ['Playtime log', 'Achievement tracker', 'Gaming habit', 'Wishlist notes'],
    status: 'soon' as const,
    connectType: 'form' as const,
  },
  // ── Everyone ──────────────────────────────────────────────────────────────────
  {
    id: 'google-calendar',
    group: 'everyone' as const,
    name: 'Google Calendar',
    monogram: 'GCal',
    color: '#4285f4',
    tagline: 'Sync your full calendar',
    description: 'Import Google Calendar events into the Maable Schedule. Keep your whole day — classes, work, personal — in one view.',
    features: ['Events → Schedule', 'Smart auto-scheduling', 'Two-way sync', 'Multiple calendars'],
    status: 'soon' as const,
    connectType: 'oauth' as const,
  },
  {
    id: 'todoist',
    group: 'everyone' as const,
    name: 'Todoist',
    monogram: 'Td',
    color: '#db4035',
    tagline: 'Migrate your existing tasks',
    description: 'Import your Todoist projects and tasks into Maable. Bring your history with you.',
    features: ['Task import', 'Project → Category', 'Labels → Tags', 'Recurring tasks'],
    status: 'soon' as const,
    connectType: 'oauth' as const,
  },
] as const

type Integration = typeof INTEGRATIONS[number]

const GROUPS = [
  { id: 'all',      label: 'All'      },
  { id: 'student',  label: 'Students' },
  { id: 'career',   label: 'Career'   },
  { id: 'hobbies',  label: 'Hobbies'  },
  { id: 'everyone', label: 'Everyone' },
] as const

type GroupFilter = typeof GROUPS[number]['id']

// ─── Canvas connect modal ─────────────────────────────────────────────────────

function CanvasConnectModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [values, setValues]     = useState({ url: '', token: '' })
  const [phase, setPhase]       = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg]     = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && phase === 'idle') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [phase, onClose])

  const ready = values.url.trim().length > 0 && values.token.trim().length > 0

  const submit = () => {
    if (!ready || phase !== 'idle') return
    setPhase('loading')
    startTransition(async () => {
      const result = await connectCanvas(values.url, values.token)
      if (result.error) {
        setErrMsg(result.error)
        setPhase('error')
        setTimeout(() => setPhase('idle'), 4000)
      } else {
        setPhase('done')
        setTimeout(() => { onDone(); onClose() }, 900)
      }
    })
  }

  const item = INTEGRATIONS.find(i => i.id === 'canvas')!

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ backdropFilter: 'blur(14px)', backgroundColor: 'rgba(10,9,8,0.55)' }}
        onClick={() => phase === 'idle' && onClose()}
      />
      <motion.div
        className="relative z-10 flex flex-col p-8 rounded-2xl"
        style={{
          backgroundColor: '#fff',
          border: '1px solid rgba(26,25,22,0.10)',
          boxShadow: '0 28px 64px rgba(0,0,0,0.16)',
          width: 'min(92vw, 440px)',
        }}
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        {/* Icon + name */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 text-xl font-bold"
            style={{ backgroundColor: item.color, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            C
          </div>
          <div>
            <p className="text-lg text-stone-900" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Connect Canvas LMS
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Your assignments will appear as tasks automatically
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4 mb-4">
          <div>
            <p className="text-xs text-stone-500 mb-1.5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Canvas URL
            </p>
            <input
              type="text"
              placeholder="canvas.youruni.edu"
              value={values.url}
              onChange={e => setValues(v => ({ ...v, url: e.target.value }))}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              className="w-full text-sm text-stone-800 outline-none px-3 py-2.5"
              style={{
                border: '1px solid rgba(26,25,22,0.12)',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                backgroundColor: '#fafaf9',
              }}
            />
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-1.5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Access Token
            </p>
            <input
              type="password"
              placeholder="Paste your access token here"
              value={values.token}
              onChange={e => setValues(v => ({ ...v, token: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              className="w-full text-sm text-stone-800 outline-none px-3 py-2.5"
              style={{
                border: '1px solid rgba(26,25,22,0.12)',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                backgroundColor: '#fafaf9',
              }}
            />
          </div>
        </div>

        {/* Help text */}
        <p className="text-xs text-stone-400 mb-5 leading-relaxed" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {item.helpText}
        </p>

        {/* Error */}
        <AnimatePresence>
          {phase === 'error' && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-red-500 mb-4 leading-relaxed"
            >
              {errMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Cancel
          </button>
          <motion.button
            onClick={submit}
            disabled={!ready || phase !== 'idle' || isPending}
            whileHover={ready && phase === 'idle' ? { scale: 1.02 } : {}}
            whileTap={ready && phase === 'idle' ? { scale: 0.97 } : {}}
            className="text-sm px-6 py-2.5 text-white rounded-xl transition-all"
            style={{
              backgroundColor: phase === 'done' ? '#22c55e' : item.color,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              opacity: ready && phase === 'idle' ? 1 : 0.5,
            }}
          >
            {phase === 'loading' ? 'Verifying…' : phase === 'done' ? 'Connected ✓' : 'Connect'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Apple Music modal (MusicKit JS) ─────────────────────────────────────────

function AppleMusicModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && phase === 'idle') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [phase, onClose])

  const authorize = async () => {
    setPhase('loading')
    try {
      // Fetch developer token from our API
      const res = await fetch('/api/auth/apple-music/token')
      if (!res.ok) throw new Error('Developer token unavailable')
      const { token } = await res.json() as { token: string }

      // Load MusicKit JS if not already loaded
      if (!window.MusicKit) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('MusicKit JS failed to load'))
          document.head.appendChild(script)
        })
      }

      if (!window.MusicKit) throw new Error('MusicKit failed to initialize')
      await window.MusicKit.configure({ developerToken: token, app: { name: 'Maable', build: '1.0.0' } })
      const musicKit = window.MusicKit.getInstance()
      await musicKit.authorize()

      setPhase('done')
      setTimeout(() => { onDone(); onClose() }, 900)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Authorization failed'
      setErrMsg(msg)
      setPhase('error')
      setTimeout(() => setPhase('idle'), 4000)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0" style={{ backdropFilter: 'blur(14px)', backgroundColor: 'rgba(10,9,8,0.55)' }}
        onClick={() => phase === 'idle' && onClose()} />
      <motion.div
        className="relative z-10 w-full max-w-sm p-7"
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        style={{ backgroundColor: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0"
            style={{ backgroundColor: '#fc3c44' }}>♪</div>
          <div>
            <p className="text-sm text-stone-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Apple Music</p>
            <p className="text-xs text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>MusicKit Authorization</p>
          </div>
        </div>

        <p className="text-xs text-stone-500 mb-6 leading-relaxed" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Clicking &quot;Connect&quot; will open Apple&apos;s authorization dialog. Sign in with your Apple ID to let Maable read your currently-playing track. No music data is stored on our servers.
        </p>

        <AnimatePresence>
          {phase === 'error' && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-red-500 mb-4">{errMsg}</motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Cancel</button>
          <motion.button
            onClick={authorize}
            disabled={phase !== 'idle'}
            whileHover={phase === 'idle' ? { scale: 1.02 } : {}}
            whileTap={phase === 'idle' ? { scale: 0.97 } : {}}
            className="text-sm px-6 py-2.5 text-white transition-all"
            style={{
              backgroundColor: phase === 'done' ? '#22c55e' : '#fc3c44',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              opacity: phase === 'idle' ? 1 : 0.6,
            }}
          >
            {phase === 'loading' ? 'Authorizing…' : phase === 'done' ? 'Connected ✓' : 'Connect Apple Music'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Integration card ─────────────────────────────────────────────────────────

function IntegrationCard({
  item,
  connected,
  lastSynced,
  onConnect,
  onDisconnect,
  onSync,
  syncing,
}: {
  item: Integration
  connected: boolean
  lastSynced: string | null
  onConnect: () => void
  onDisconnect: () => void
  onSync?: (() => void) | undefined
  syncing?: boolean | undefined
}) {
  const soon = item.status === 'soon'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col p-6 rounded-2xl"
      style={{
        border: connected
          ? `1.5px solid ${item.color}50`
          : '1px solid rgba(26,25,22,0.08)',
        backgroundColor: connected ? `${item.color}07` : '#ffffff',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs shrink-0 font-semibold"
          style={{ backgroundColor: item.color, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          {item.monogram}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-stone-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {item.name}
            </p>
            {connected && (
              <span className="text-[10px] px-1.5 py-0.5 rounded text-emerald-600" style={{ backgroundColor: 'rgba(16,185,129,0.10)' }}>
                connected
              </span>
            )}
            {soon && !connected && (
              <span className="text-[10px] px-1.5 py-0.5 rounded text-stone-400" style={{ backgroundColor: 'rgba(26,25,22,0.05)' }}>
                soon
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-0.5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {item.tagline}
          </p>
        </div>
      </div>

      <p className="text-xs text-stone-500 leading-relaxed mb-4 flex-1">{item.description}</p>

      {/* Feature tags */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {item.features.map(f => (
          <span
            key={f}
            className="text-[11px] px-2 py-0.5 text-stone-400"
            style={{ backgroundColor: 'rgba(26,25,22,0.04)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Action row */}
      {connected ? (
        <div className="flex items-center justify-between">
          <button
            onClick={onDisconnect}
            className="text-xs text-stone-400 hover:text-red-400 transition-colors"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Disconnect
          </button>
          <div className="flex items-center gap-4">
            {lastSynced && (
              <p className="text-[10px] text-stone-300" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                synced {formatSyncTime(lastSynced)}
              </p>
            )}
            {onSync && (
              <button
                onClick={onSync}
                disabled={syncing}
                className="text-xs transition-colors"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: item.color, opacity: syncing ? 0.5 : 1 }}
              >
                {syncing ? 'Syncing…' : 'Sync now →'}
              </button>
            )}
          </div>
        </div>
      ) : soon ? (
        <p className="text-xs text-stone-300" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Coming soon
        </p>
      ) : (
        <button
          onClick={onConnect}
          className="text-xs transition-colors text-left"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: item.color }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Connect →
        </button>
      )}
    </motion.div>
  )
}

function formatSyncTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface ConnectClientProps {
  connectedIntegrations: ConnectedIntegration[]
  flashConnected: string | null
  flashError: string | null
}

export function ConnectClient({ connectedIntegrations, flashConnected, flashError }: ConnectClientProps) {
  const [filter, setFilter]     = useState<GroupFilter>('all')
  const [active, setActive]     = useState<string | null>(null)
  const [syncing, setSyncing]   = useState(false)
  const [syncMsg, setSyncMsg]   = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [, startTransition]   = useTransition()

  // Build a map for fast lookup: provider → integration details
  const [connectedMap, setConnectedMap] = useState<Map<string, ConnectedIntegration>>(() => {
    const m = new Map<string, ConnectedIntegration>()
    for (const c of connectedIntegrations) m.set(c.provider, c)
    return m
  })

  // Show toast when returning from OAuth callback
  useEffect(() => {
    if (flashConnected) setSyncMsg(`${flashConnected} connected!`)
    if (flashError)     setSyncMsg(`Error: ${flashError}`)
    const t = setTimeout(() => setSyncMsg(null), 4000)
    return () => clearTimeout(t)
  }, [flashConnected, flashError])

  const visible = filter === 'all'
    ? [...INTEGRATIONS]
    : INTEGRATIONS.filter(i => i.group === filter)

  const connectedCount = connectedMap.size

  const handleDisconnect = (id: string) => {
    startTransition(async () => {
      const result = await disconnectIntegration(id)
      if (!result.error) {
        setConnectedMap(m => { const n = new Map(m); n.delete(id); return n })
      }
    })
  }

  const handleDone = (id: string) => {
    // After a successful connect, mark as connected locally
    // The page will also revalidate server-side
    setConnectedMap(m => new Map(m).set(id, {
      provider:         id,
      is_active:        true,
      last_synced_at:   null,
      provider_user_id: null,
    }))
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    const result = await triggerCanvasSync()
    setSyncing(false)
    if (result.error) {
      setSyncMsg(`Sync failed: ${result.error}`)
    } else {
      setSyncMsg(result.synced === 0
        ? 'All assignments up to date'
        : `Synced ${result.synced} new assignment${result.synced !== 1 ? 's' : ''} → Student page`)
    }
    setTimeout(() => setSyncMsg(null), 5000)
  }

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden" style={{ backgroundColor: '#fafaf9' }}>

      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 py-8 pl-10 pr-6"
        style={{ width: 230, borderRight: '1px solid rgba(26,25,22,0.07)' }}
      >
        <h1
          className="text-4xl text-stone-900 mb-1 leading-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Connect
        </h1>
        <p className="text-sm text-stone-400 mb-7">
          {connectedCount} connected
        </p>

        <nav className="flex flex-col gap-1">
          {GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => setFilter(g.id)}
              className="text-left px-3 py-2 text-sm transition-colors rounded-lg"
              style={{
                backgroundColor: filter === g.id ? '#1a1916' : 'transparent',
                color: filter === g.id ? '#fff' : '#78716c',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              {g.label}
              {g.id !== 'all' && (
                <span className="ml-2 text-xs opacity-50">
                  {INTEGRATIONS.filter(i => i.group === g.id).length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {connectedCount > 0 && (
          <>
            <div className="w-full h-px my-5" style={{ backgroundColor: 'rgba(26,25,22,0.07)' }} />
            <p className="text-xs text-stone-300 mb-2 px-3 tracking-widest uppercase">Active</p>
            {Array.from(connectedMap.keys()).map(id => {
              const item = INTEGRATIONS.find(i => i.id === id)
              if (!item) return null
              return (
                <div key={id} className="flex items-center gap-2 px-3 py-1.5">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: item.color, fontSize: 8, fontWeight: 600 }}
                  >
                    {item.monogram.slice(0, 1)}
                  </div>
                  <p className="text-xs text-stone-600" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {item.name}
                  </p>
                </div>
              )
            })}
          </>
        )}

        <div className="flex-1" />

        {/* Setup guide button */}
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs transition-colors text-left w-full"
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: '#a8a29e',
            border: '1px solid rgba(26,25,22,0.08)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1a1916'; e.currentTarget.style.borderColor = 'rgba(26,25,22,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#a8a29e'; e.currentTarget.style.borderColor = 'rgba(26,25,22,0.08)' }}
        >
          <span style={{ fontSize: 14 }}>?</span>
          Setup guide
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/chibi-working.png"
          alt=""
          className="w-28 opacity-15 object-contain self-center"
          draggable={false}
        />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-10 pt-8 pb-16 relative" style={{ scrollbarWidth: 'none' }}>

        {/* Sync message toast */}
        <AnimatePresence>
          {syncMsg && (
            <motion.div
              key="syncmsg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-6 right-10 z-10 text-xs px-4 py-2.5 rounded-xl"
              style={{
                backgroundColor: syncMsg.startsWith('Error') ? 'rgba(239,68,68,0.10)' : 'rgba(34,197,94,0.10)',
                border: `1px solid ${syncMsg.startsWith('Error') ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
                color: syncMsg.startsWith('Error') ? '#ef4444' : '#16a34a',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              {syncMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-sm text-stone-400 mb-7" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {visible.length} integration{visible.length !== 1 ? 's' : ''} ·{' '}
          {visible.filter(i => connectedMap.has(i.id)).length} connected
        </p>

        <motion.div
          layout
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))' }}
        >
          <AnimatePresence mode="popLayout">
            {visible.map(item => {
              const conn = connectedMap.get(item.id) ?? null
              return (
                <IntegrationCard
                  key={item.id}
                  item={item}
                  connected={!!conn}
                  lastSynced={conn?.last_synced_at ?? null}
                  onConnect={() => {
                    if (item.id === 'spotify') {
                      window.location.href = '/api/auth/spotify'
                    } else if (item.id === 'apple-music') {
                      setActive('apple-music')
                    } else {
                      setActive(item.id)
                    }
                  }}
                  onDisconnect={() => handleDisconnect(item.id)}
                  onSync={item.id === 'canvas' && conn ? handleSync : undefined}
                  syncing={item.id === 'canvas' ? syncing : false}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Canvas connect modal */}
      <AnimatePresence>
        {active === 'canvas' && (
          <CanvasConnectModal
            onClose={() => setActive(null)}
            onDone={() => handleDone('canvas')}
          />
        )}
        {active === 'apple-music' && (
          <AppleMusicModal
            onClose={() => setActive(null)}
            onDone={() => handleDone('apple-music')}
          />
        )}
        {showGuide && (
          <SetupGuideModal
            onClose={() => setShowGuide(false)}
            onConnect={(id) => {
              setShowGuide(false)
              if (id === 'spotify') {
                window.location.href = '/api/auth/spotify'
              } else {
                setActive(id)
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
