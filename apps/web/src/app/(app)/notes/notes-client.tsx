'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Note } from '@maable/core'
import { createNote, updateNote, togglePin, deleteNote } from './actions'
import { useADHD } from '@/lib/adhd-context'
import { typeSpark, scrambleGhost, playType } from '@/components/app/adhd-effects'

// ─── Note covers ─────────────────────────────────────────────────────────────

interface NoteCover {
  id: string
  label: string
  tier: 'free' | 'premium'
  type: 'gradient' | 'image'
  bg: string        // CSS background (gradient string, or fallback colour for images)
  textColor: string
  img?: string      // URL for image-type covers
}

const NOTE_COVERS: NoteCover[] = [
  // ── Free: gradients ────────────────────────────────────────────────────────
  { id: 'sunrise',  label: 'Sunrise',   tier: 'free', type: 'gradient', textColor: '#fff',     bg: 'linear-gradient(160deg,#f6d365 0%,#fda085 100%)' },
  { id: 'ocean',    label: 'Ocean',     tier: 'free', type: 'gradient', textColor: '#fff',     bg: 'linear-gradient(160deg,#667eea 0%,#764ba2 100%)' },
  { id: 'forest',   label: 'Forest',   tier: 'free', type: 'gradient', textColor: '#fff',     bg: 'linear-gradient(160deg,#11998e 0%,#38ef7d 100%)' },
  { id: 'dusk',     label: 'Dusk',     tier: 'free', type: 'gradient', textColor: '#fff',     bg: 'linear-gradient(160deg,#fc466b 0%,#3f5efb 100%)' },
  { id: 'gold',     label: 'Gold',     tier: 'free', type: 'gradient', textColor: '#1a1916', bg: 'linear-gradient(160deg,#f7971e 0%,#ffd200 100%)' },
  { id: 'charcoal', label: 'Charcoal', tier: 'free', type: 'gradient', textColor: '#c9a84c', bg: 'linear-gradient(160deg,#1a1916 0%,#57534e 100%)' },
  // ── Free: illustration images ───────────────────────────────────────────────
  { id: 'reading',  label: 'Reading',  tier: 'free', type: 'image', textColor: '#fff', bg: 'linear-gradient(160deg,#a8edea,#fed6e3)', img: '/illustrations/category-reading.png' },
  { id: 'student',  label: 'Student',  tier: 'free', type: 'image', textColor: '#fff', bg: 'linear-gradient(160deg,#4776e6,#8e54e9)', img: '/illustrations/category-student.png' },
  { id: 'career',   label: 'Career',   tier: 'free', type: 'image', textColor: '#fff', bg: 'linear-gradient(160deg,#8b5cf6,#d946ef)', img: '/illustrations/category-career.png' },
  { id: 'hobbies',  label: 'Hobbies',  tier: 'free', type: 'image', textColor: '#fff', bg: 'linear-gradient(160deg,#22c55e,#16a34a)', img: '/illustrations/category-hobbies.png' },
  { id: 'chill',    label: 'Chill',    tier: 'free', type: 'image', textColor: '#fff', bg: 'linear-gradient(160deg,#f59e0b,#ef4444)', img: '/illustrations/category-lazy.png' },
  // ── Premium ─────────────────────────────────────────────────────────────────
  { id: 'neon-grid', label: 'Neon Grid',  tier: 'premium', type: 'gradient', textColor: '#00ffcc', bg: 'linear-gradient(160deg,#050010 0%,#0a0028 50%,#001020 100%)' },
  { id: 'galaxy',    label: 'Galaxy',     tier: 'premium', type: 'gradient', textColor: '#e0c3fc', bg: 'linear-gradient(160deg,#090979 0%,#00d4ff 100%)' },
  { id: 'vapour',    label: 'VaporWave', tier: 'premium', type: 'gradient', textColor: '#fff',     bg: 'linear-gradient(160deg,#ff6fd8 0%,#3813c2 100%)' },
  { id: 'sakura',    label: 'Sakura',    tier: 'premium', type: 'gradient', textColor: '#7b2d4e', bg: 'linear-gradient(160deg,#ffe4e1 0%,#ff9cba 50%,#ffd6e7 100%)' },
  { id: 'holo',      label: 'Holo',      tier: 'premium', type: 'gradient', textColor: '#fff',     bg: 'linear-gradient(160deg,#f093fb 0%,#f5576c 25%,#4facfe 50%,#43e97b 75%,#f093fb 100%)' },
  { id: 'street',    label: 'Street Art',tier: 'premium', type: 'gradient', textColor: '#fff',     bg: 'linear-gradient(160deg,#f7971e 0%,#c70039 33%,#900c3f 66%,#1c1c2e 100%)' },
  { id: 'matrix',    label: 'Matrix',    tier: 'premium', type: 'gradient', textColor: '#00ff41', bg: 'linear-gradient(180deg,#0d0208 0%,#003b00 100%)' },
  { id: 'glitch',    label: 'Glitch',    tier: 'premium', type: 'gradient', textColor: '#ff00ff', bg: 'linear-gradient(135deg,#0a0a0a 0%,#1a001a 50%,#000a0a 100%)' },
]

function getCover(id: string | null): NoteCover | null {
  return NOTE_COVERS.find(c => c.id === id) ?? null
}

function coverBgStyle(cover: NoteCover): {
  background: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
} {
  if (cover.type === 'image' && cover.img) {
    return {
      background: cover.bg,
      backgroundImage: `url(${cover.img})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return { background: cover.bg }
}

function loadCover(noteId: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(`maable-note-cover-${noteId}`)
}

function saveCover(noteId: string, coverId: string | null) {
  if (typeof window === 'undefined') return
  if (coverId) localStorage.setItem(`maable-note-cover-${noteId}`, coverId)
  else localStorage.removeItem(`maable-note-cover-${noteId}`)
}

// ─── Cover grid (shared between picker and new-note setup) ────────────────────

function CoverGrid({
  current,
  onSelect,
  compact = false,
  dark = false,
  columns,
}: {
  current: string | null
  onSelect: (id: string | null) => void
  compact?: boolean
  dark?: boolean
  columns?: number
}) {
  const thumbH   = compact ? 68 : 80
  const cols     = columns ?? (compact ? 4 : 4)
  const selColor = dark ? '#fff' : '#1a1916'
  const labelColor = dark ? 'rgba(255,255,255,0.45)' : '#78716c'

  return (
    <div>
      {/* Free */}
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'Georgia, serif', color: labelColor }}>Free</p>
      <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
        {/* No cover */}
        <button
          onClick={() => onSelect(null)}
          style={{
            height: thumbH, borderRadius: 5,
            border: `2px solid ${current === null ? selColor : dark ? 'rgba(255,255,255,0.12)' : 'rgba(26,25,22,0.12)'}`,
            background: 'linear-gradient(160deg, #1e1a18 0%, #2e2a26 40%, #e8ddd0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
          title="Default"
        >
          <span style={{ fontSize: 9, color: '#a09080', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>default</span>
        </button>
        {NOTE_COVERS.filter(c => c.tier === 'free').map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            title={c.label}
            style={{
              height: thumbH, borderRadius: 5, cursor: 'pointer', position: 'relative', overflow: 'hidden',
              outline: current === c.id ? `2.5px solid ${selColor}` : '2px solid transparent',
              outlineOffset: 2,
              ...coverBgStyle(c),
            }}
          >
            {c.type === 'image' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)',
              }} />
            )}
            <span style={{
              position: 'absolute', bottom: 3, left: 4, right: 4,
              fontSize: 8, color: c.textColor, opacity: 0.9,
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Premium */}
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'Georgia, serif', color: labelColor }}>
        Premium <span style={{ color: '#c9a84c' }}>✦</span>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
        {NOTE_COVERS.filter(c => c.tier === 'premium').map(c => (
          <div key={c.id} style={{ position: 'relative', opacity: 0.5, cursor: 'not-allowed' }}>
            <div style={{ height: thumbH, borderRadius: 5, ...coverBgStyle(c), overflow: 'hidden' }}>
              <span style={{
                position: 'absolute', bottom: 3, left: 4, right: 4,
                fontSize: 8, color: c.textColor, opacity: 0.85,
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>{c.label}</span>
            </div>
            <span style={{ position: 'absolute', top: 3, right: 3, fontSize: 7, color: '#c9a84c', fontFamily: 'Georgia, serif', letterSpacing: '0.04em' }}>Pro</span>
          </div>
        ))}
      </div>
      {!compact && (
        <p style={{ fontSize: 9, color: labelColor, marginTop: 12, textAlign: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Pro covers unlock with Maable Pro — coming soon
        </p>
      )}
    </div>
  )
}


// ─── IDE line numbers ─────────────────────────────────────────────────────────

function LineNumbers({ text, lineHeight = 28 }: { text: string; lineHeight?: number }) {
  const count = text.split('\n').length || 1
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 52, paddingTop: 0, paddingRight: 12,
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end',
        userSelect: 'none', pointerEvents: 'none',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: 12, lineHeight: `${lineHeight}px`,
        color: 'rgba(0,255,200,0.20)',
        borderRight: '1px solid rgba(0,255,200,0.08)',
        backgroundColor: '#0a0f16',
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{i + 1}</span>
      ))}
    </div>
  )
}

// ─── Fonts ────────────────────────────────────────────────────────────────────

const FONTS = [
  { id: 'serif',    label: 'Serif',    css: 'Georgia, serif' },
  { id: 'literary', label: 'Literary', css: '"Book Antiqua", Palatino, Georgia, serif' },
  { id: 'sans',     label: 'Sans',     css: 'system-ui, -apple-system, sans-serif' },
  { id: 'mono',     label: 'Mono',     css: '"Courier New", Courier, monospace' },
] as const

type FontId = typeof FONTS[number]['id']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractText(note: Note): string {
  if (note.content_text) return note.content_text
  try {
    const doc = note.content as { content?: Array<{ content?: Array<{ text?: string }> }> }
    return (
      doc.content
        ?.map((p) => p.content?.map((n) => n.text ?? '').join('') ?? '')
        .join('\n') ?? ''
    )
  } catch {
    return ''
  }
}


function wordCount(text: string) {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n')
  let html = ''
  let inUL = false, inOL = false, inPre = false

  const closeList = () => {
    if (inUL) { html += '</ul>'; inUL = false }
    if (inOL) { html += '</ol>'; inOL = false }
  }

  const inline = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link">$1</a>')

  for (const raw of lines) {
    if (raw.startsWith('```')) {
      if (!inPre) { closeList(); html += '<pre class="md-pre"><code>'; inPre = true }
      else { html += '</code></pre>'; inPre = false }
      continue
    }
    if (inPre) { html += escHtml(raw) + '\n'; continue }
    if (/^---+$/.test(raw)) { closeList(); html += '<hr class="md-hr">'; continue }
    if (raw.startsWith('### ')) { closeList(); html += `<h3 class="md-h3">${inline(raw.slice(4))}</h3>`; continue }
    if (raw.startsWith('## ')) { closeList(); html += `<h2 class="md-h2">${inline(raw.slice(3))}</h2>`; continue }
    if (raw.startsWith('# ')) { closeList(); html += `<h1 class="md-h1">${inline(raw.slice(2))}</h1>`; continue }
    if (raw.startsWith('> ')) { closeList(); html += `<blockquote class="md-bq">${inline(raw.slice(2))}</blockquote>`; continue }
    const ul = raw.match(/^[-*+]\s(.*)/)
    if (ul) {
      if (inOL) { html += '</ol>'; inOL = false }
      if (!inUL) { html += '<ul class="md-ul">'; inUL = true }
      html += `<li>${inline(ul[1]!)}</li>`; continue
    }
    const ol = raw.match(/^\d+\.\s(.*)/)
    if (ol) {
      if (inUL) { html += '</ul>'; inUL = false }
      if (!inOL) { html += '<ol class="md-ol">'; inOL = true }
      html += `<li>${inline(ol[1]!)}</li>`; continue
    }
    closeList()
    if (!raw.trim()) { html += '<br>'; continue }
    html += `<p class="md-p">${inline(raw)}</p>`
  }
  closeList()
  if (inPre) html += '</code></pre>'
  return html
}

// ─── Flashcard types + SM-2 ───────────────────────────────────────────────────

interface FlashCard {
  id: string
  question: string
  answer: string
  section?: string  // which heading/subsection this card came from
  interval: number
  easeFactor: number
  due: string | null
  reps: number
}

function sm2(card: FlashCard, rating: 1 | 2 | 3 | 4): FlashCard {
  const ef = Math.max(1.3, card.easeFactor + 0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02))
  let interval: number
  if (rating === 1) interval = 1
  else if (card.reps === 0) interval = 1
  else if (card.reps === 1) interval = 6
  else interval = Math.round(card.interval * ef)
  const due = new Date()
  due.setDate(due.getDate() + interval)
  return { ...card, interval, easeFactor: ef, due: due.toISOString().slice(0, 10), reps: rating === 1 ? 0 : card.reps + 1 }
}

function loadCards(noteId: string): FlashCard[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`maable-cards-${noteId}`) ?? '[]') as FlashCard[] }
  catch { return [] }
}

function persistCards(noteId: string, cards: FlashCard[]) {
  localStorage.setItem(`maable-cards-${noteId}`, JSON.stringify(cards))
}

// ─── Revision Mode ────────────────────────────────────────────────────────────

function RevisionMode({ cards, onClose, onUpdate }: {
  cards: FlashCard[]
  onClose: () => void
  onUpdate: (cards: FlashCard[]) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [queue, setQueue] = useState<FlashCard[]>(() =>
    [...cards].filter(c => !c.due || c.due <= today).sort(() => Math.random() - 0.5)
  )
  const [reviewed, setReviewed] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const current = queue[0]

  const rate = (rating: 1 | 2 | 3 | 4) => {
    if (!current) return
    const updated = sm2(current, rating)
    onUpdate(cards.map(c => c.id === current.id ? updated : c))
    const remaining = queue.slice(1)
    if (rating === 1) remaining.push(updated)
    setQueue(remaining)
    setFlipped(false)
    setReviewed(r => r + 1)
  }

  if (!current) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
        style={{ backgroundColor: '#1a1916' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <p className="text-white text-4xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {queue.length === 0 && reviewed === 0 ? 'No cards due today' : 'All done!'}
        </p>
        <p className="text-stone-500 text-sm" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {reviewed > 0 ? `Reviewed ${reviewed} card${reviewed !== 1 ? 's' : ''}` : 'Check back tomorrow'}
        </p>
        <button
          onClick={onClose}
          className="mt-4 text-stone-500 hover:text-stone-300 transition-colors text-sm"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          ← back to note
        </button>
      </motion.div>
    )
  }

  const total = queue.length + reviewed
  const progress = total > 0 ? (reviewed / total) * 100 : 0

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#1a1916' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 shrink-0">
        <button
          onClick={onClose}
          className="text-stone-500 hover:text-stone-300 transition-colors text-sm"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          ← exit
        </button>
        <p className="text-stone-600 text-xs tabular-nums" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {queue.length} remaining
        </p>
      </div>

      {/* Progress bar */}
      <div className="mx-8 mt-4 mb-10 h-px shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div
                key="front"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
                className="flex flex-col items-center justify-center text-center px-12 py-14 cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.07)', minHeight: 300 }}
                onClick={() => setFlipped(true)}
              >
                {current.section && (
                  <p className="text-stone-700 text-[10px] tracking-widest uppercase mb-3">
                    {current.section}
                  </p>
                )}
                <p className="text-stone-600 text-[10px] tracking-widest uppercase mb-8">question</p>
                <p className="text-white leading-relaxed" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', maxWidth: '36ch' }}>
                  {current.question}
                </p>
                <p className="text-stone-700 text-xs mt-10" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  tap to reveal
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
                className="flex flex-col items-center text-center px-12 py-10"
                style={{ border: '1px solid rgba(255,255,255,0.07)', minHeight: 300 }}
              >
                <p className="text-stone-600 text-[10px] tracking-widest uppercase mb-6">answer</p>
                <p className="text-stone-200 leading-relaxed mb-12" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1rem, 1.8vw, 1.4rem)', maxWidth: '36ch' }}>
                  {current.answer}
                </p>
                <div className="flex gap-3">
                  {([
                    { label: 'Again', r: 1 as const, color: '#ef4444' },
                    { label: 'Hard',  r: 2 as const, color: '#f97316' },
                    { label: 'Good',  r: 3 as const, color: '#22c55e' },
                    { label: 'Easy',  r: 4 as const, color: '#3b82f6' },
                  ]).map(({ label, r, color }) => (
                    <motion.button
                      key={label}
                      onClick={() => rate(r)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                      className="px-5 py-2.5 text-sm transition-colors"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color, border: `1px solid ${color}30`, backgroundColor: `${color}10` }}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Flashcards panel ────────────────────────────────────────────────────────

function FlashcardsPanel({ cards, onChange, title, body, category }: {
  cards: FlashCard[]
  onChange: (cards: FlashCard[]) => void
  title: string
  body: string
  category: CategoryId | null
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const dueCount = cards.filter(c => !c.due || c.due <= today).length
  const catConfig = NOTE_CATEGORIES.find(c => c.id === category)

  const addCard = () => {
    const card: FlashCard = { id: crypto.randomUUID(), question: '', answer: '', interval: 1, easeFactor: 2.5, due: null, reps: 0 }
    onChange([...cards, card])
    setEditingId(card.id)
  }

  const update = (id: string, field: 'question' | 'answer', val: string) =>
    onChange(cards.map(c => c.id === id ? { ...c, [field]: val } : c))

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      const generated = generateCardsFromText(title, body)
      const existingQs = new Set(cards.map(c => c.question.toLowerCase()))
      const fresh = generated.filter(c => !existingQs.has(c.question.toLowerCase()))
      onChange([...cards, ...fresh])
      setGenerating(false)
    }, 60)
  }

  return (
    <div className="flex-1 overflow-y-auto px-10 py-6" style={{ scrollbarWidth: 'none' }}>
      {/* Category hint */}
      {catConfig && (
        <div
          className="mb-5 px-4 py-3 rounded-xl"
          style={{ backgroundColor: `${catConfig.color}12`, border: `1px solid ${catConfig.color}28` }}
        >
          <p className="text-xs" style={{ color: catConfig.color, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {catConfig.hint}
          </p>
        </div>
      )}

      {/* Generate button */}
      {body.trim().length > 40 && (
        <motion.button
          onClick={handleGenerate}
          disabled={generating}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 w-full text-sm transition-colors py-3 px-4 mb-5 rounded-xl"
          style={{
            border: '1px solid rgba(26,25,22,0.10)',
            color: generating ? '#a8a29e' : '#57534e',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            backgroundColor: 'rgba(26,25,22,0.02)',
          }}
        >
          <span style={{ fontSize: '1rem', opacity: generating ? 0.4 : 0.7 }}>✦</span>
          {generating ? 'Generating...' : cards.length === 0 ? 'Generate cards from note' : 'Generate more from note'}
        </motion.button>
      )}

      {/* Category example prompts — shown when no cards yet */}
      {cards.length === 0 && catConfig && 'examples' in catConfig && (
        <div className="mb-5">
          <p className="text-[10px] text-stone-300 tracking-widest uppercase mb-2">Example cards for {catConfig.label}</p>
          <div className="flex flex-col gap-1.5">
            {(catConfig as { examples: readonly string[] }).examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  const card: FlashCard = { id: crypto.randomUUID(), question: ex, answer: '', interval: 1, easeFactor: 2.5, due: null, reps: 0 }
                  onChange([...cards, card])
                }}
                className="text-left text-xs text-stone-400 hover:text-stone-700 transition-colors py-1.5 px-3 rounded-lg"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', backgroundColor: 'rgba(26,25,22,0.03)' }}
              >
                + {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <div className="flex gap-8 mb-7">
          <div>
            <p className="text-2xl text-stone-800 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{cards.length}</p>
            <p className="text-xs text-stone-400 mt-0.5">cards</p>
          </div>
          <div>
            <p className="text-2xl text-stone-800 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{dueCount}</p>
            <p className="text-xs text-stone-400 mt-0.5">due today</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {cards.map(card => {
            const editing = editingId === card.id
            const due = !card.due || card.due <= today
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="group flex flex-col gap-2 px-4 py-3"
                style={{ border: `1px solid ${editing ? 'rgba(26,25,22,0.14)' : 'rgba(26,25,22,0.07)'}` }}
              >
                {editing ? (
                  <>
                    <div>
                      <p className="text-[10px] text-stone-400 mb-1 tracking-widest uppercase">Q</p>
                      <textarea
                        value={card.question}
                        onChange={e => update(card.id, 'question', e.target.value)}
                        placeholder="Question..."
                        rows={2}
                        autoFocus
                        className="w-full text-sm text-stone-800 bg-transparent outline-none resize-none"
                        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}
                      />
                    </div>
                    <div className="h-px" style={{ backgroundColor: 'rgba(26,25,22,0.06)' }} />
                    <div>
                      <p className="text-[10px] text-stone-400 mb-1 tracking-widest uppercase">A</p>
                      <textarea
                        value={card.answer}
                        onChange={e => update(card.id, 'answer', e.target.value)}
                        placeholder="Answer..."
                        rows={2}
                        className="w-full text-sm text-stone-600 bg-transparent outline-none resize-none"
                        style={{ fontFamily: 'Georgia, serif', lineHeight: 1.6 }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                      >done</button>
                      <button
                        onClick={() => { onChange(cards.filter(c => c.id !== card.id)); setEditingId(null) }}
                        className="text-xs text-stone-300 hover:text-red-400 transition-colors"
                      >delete</button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setEditingId(card.id)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-800 leading-snug" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                        {card.question || <span className="text-stone-300">No question yet</span>}
                      </p>
                      {card.answer && (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">{card.answer}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {due && (
                        <span className="text-[10px] px-1.5 py-0.5 text-amber-600 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.10)' }}>
                          due
                        </span>
                      )}
                      {card.reps > 0 && (
                        <span className="text-[10px] text-stone-300">{card.reps}×</span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        <button
          onClick={addCard}
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors py-3 mt-1"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          <span className="w-5 h-5 border border-stone-200 flex items-center justify-center text-sm leading-none">+</span>
          Add a card
        </button>
      </div>
    </div>
  )
}

// ─── Note categories ──────────────────────────────────────────────────────────

const NOTE_CATEGORIES = [
  {
    id: 'study',
    label: 'Study',
    color: '#3b82f6',
    hint: 'Definitions, key terms, and concepts to memorise — perfect for lectures and textbooks.',
    examples: ['What is [term]?', 'Explain [concept] simply', 'What are the steps of [process]?', 'Compare [A] vs [B]'],
  },
  {
    id: 'career',
    label: 'Career',
    color: '#8b5cf6',
    hint: 'Build your interview story, log achievements, and prep STAR answers.',
    examples: ['STAR: Tell me about a time you led a project', 'What\'s your key win at [company]?', 'How would you explain [skill] in an interview?', 'Why do you want to work in [field]?'],
  },
  {
    id: 'work',
    label: 'Work',
    color: '#f97316',
    hint: 'Capture meeting decisions, action items, and project knowledge before it disappears.',
    examples: ['What was decided about [topic]?', 'Who owns [deliverable] and by when?', 'What\'s the context behind [decision]?'],
  },
  {
    id: 'hobbies',
    label: 'Hobbies',
    color: '#22c55e',
    hint: 'Log techniques, tips, and progress notes for what you love doing.',
    examples: ['How do you [technique] correctly?', 'What\'s the next skill milestone for [hobby]?', 'What did you learn in today\'s session?'],
  },
  {
    id: 'language',
    label: 'Language',
    color: '#06b6d4',
    hint: 'Vocabulary, grammar rules, conjugations, and phrases for your target language.',
    examples: ['What does "[word]" mean?', 'How do you conjugate [verb] in past tense?', 'Translate: "[common phrase]"', 'When do you use [grammar rule]?'],
  },
  {
    id: 'health',
    label: 'Health',
    color: '#ef4444',
    hint: 'Medical terms, fitness knowledge, nutrition facts, and wellbeing notes.',
    examples: ['What does [medical term] mean?', 'How does [exercise] benefit the body?', 'What are the steps in [routine]?'],
  },
  {
    id: 'finance',
    label: 'Finance',
    color: '#eab308',
    hint: 'Build financial literacy — investing, budgeting, taxes, and money concepts.',
    examples: ['What is [financial term]?', 'How does [investment type] work?', 'What\'s the difference between [A] and [B]?', 'What are the rules for [tax concept]?'],
  },
  {
    id: 'personal',
    label: 'Personal',
    color: '#ec4899',
    hint: 'Reflect on your goals, values, and growth. Journal prompts turned into cards.',
    examples: ['What did you learn from [experience]?', 'What\'s your why behind [goal]?', 'How do you define [value]?'],
  },
  {
    id: 'creative',
    label: 'Creative',
    color: '#a855f7',
    hint: 'Capture ideas, inspiration, and techniques for your creative work.',
    examples: ['What inspired [project/idea]?', 'How does [technique] work?', 'What\'s the core theme of [work]?'],
  },
] as const

type CategoryId = typeof NOTE_CATEGORIES[number]['id']

function getCategoryFromTags(tags: string[]): CategoryId | null {
  for (const tag of tags) {
    if (tag.startsWith('__cat:')) return tag.slice(6) as CategoryId
  }
  return null
}

function setCategoryOnTags(tags: string[], cat: CategoryId | null): string[] {
  const base = tags.filter(t => !t.startsWith('__cat:'))
  return cat ? [...base, `__cat:${cat}`] : base
}

// ─── Auto-generate flashcards ─────────────────────────────────────────────────

function generateCardsFromText(title: string, body: string): FlashCard[] {
  const seen = new Set<string>()
  const cards: FlashCard[] = []

  const clean = (s: string) => s.replace(/\*\*/g, '').replace(/[_*~`#]/g, '').replace(/\s+/g, ' ').trim()

  const make = (q: string, a: string, sec?: string): FlashCard => ({
    id: crypto.randomUUID(),
    question: clean(q), answer: clean(a),
    ...(sec !== undefined ? { section: sec } : {}),
    interval: 1, easeFactor: 2.5, due: null, reps: 0,
  })

  const push = (q: string, a: string, sec?: string) => {
    const cq = clean(q); const ca = clean(a)
    if (cq.length < 8 || ca.length < 4) return
    const key = cq.toLowerCase().slice(0, 50)
    if (seen.has(key)) return
    seen.add(key)
    cards.push(make(cq, ca, sec))
  }

  // ── Context tracking ─────────────────────────────────────────────────────
  let section = title || 'General'
  let subsection: string | null = null
  const bulletBuffer: string[] = []
  const ctx = () => subsection ?? section

  const flushBullets = () => {
    if (bulletBuffer.length >= 2) {
      push(
        `What are the key points of "${ctx()}"?`,
        bulletBuffer.map(b => `• ${b}`).join('\n'),
        ctx()
      )
    }
    bulletBuffer.length = 0
  }

  const isHeading = (text: string) => {
    if (/^#{1,6}\s/.test(text)) return true
    // ALL CAPS line
    if (/^[A-Z][A-Z\s&]{2,}$/.test(text) && text.length < 60) return true
    // Title Case (2–6 capitalised words, no trailing punctuation)
    const words = text.split(' ')
    return words.length >= 2 && words.length <= 7
      && words.every(w => /^[A-Z]/.test(w))
      && !/[.,;!?]$/.test(text)
  }

  // ── Line-by-line pass ─────────────────────────────────────────────────────
  for (const rawLine of body.split('\n')) {
    if (!rawLine.trim()) continue
    const text = clean(rawLine)
    if (!text) continue

    // Heading → new section
    if (isHeading(text)) {
      flushBullets()
      section = text.replace(/^#{1,6}\s*/, '').trim()
      subsection = null
      continue
    }

    // Subsection: short line ending with colon (not a definition)
    if (text.endsWith(':') && text.length < 80 && !text.includes(' - ') && text.split(' ').length <= 8) {
      flushBullets()
      subsection = text.slice(0, -1).trim()
      continue
    }

    // **Bold term**: definition inline
    const boldInline = text.match(/^\*\*([^*]{3,55})\*\*[:\s–\-]+(.{15,220})$/)
    if (boldInline) { push(`What is "${boldInline[1]!.trim()}"?`, boldInline[2]!.trim(), ctx()); continue }

    // Term: definition (colon inline)
    const colonDef = text.match(/^[-*•]?\s*([A-Za-z][^:]{2,45}):\s+(.{15,220})$/)
    if (colonDef && !colonDef[1]!.trim().startsWith('#')) {
      push(`What is ${colonDef[1]!.trim()}?`, colonDef[2]!.trim(), ctx()); continue
    }

    // Term - definition (dash separator, not a bullet)
    const dashDef = text.match(/^([^–\-]{3,45})\s+[-–]\s+(.{10,200})$/)
    if (dashDef && !/^[-•*]/.test(rawLine.trimStart())) {
      push(`What is ${dashDef[1]!.trim()}?`, dashDef[2]!.trim(), ctx()); continue
    }

    // X is/are (a/an/the) Y — short sentences only, avoids "This is a test"
    const isA = text.match(/^([A-Z][a-zA-Z\s]{2,35}?)\s+(?:is|are)\s+(?:a |an |the )?([^.]{15,160})[.]?$/)
    if (isA && !text.endsWith('?') && text.split(' ').length < 22 && !isA[1]!.toLowerCase().startsWith('this') && !isA[1]!.toLowerCase().startsWith('it')) {
      push(`What is ${isA[1]!.trim()}?`, `${isA[1]!.trim()} is ${isA[2]!.trim()}.`, ctx()); continue
    }

    // A vs/versus B — comparison card (extract real sides, no placeholder)
    const vsMatch = text.match(/^(.{4,60}?)\s+(?:vs\.?|versus)\s+(.{4,60})$/i)
    if (vsMatch) {
      const [a, b] = [vsMatch[1]!.trim(), vsMatch[2]!.trim()]
      push(`What is the difference between ${a} and ${b}?`, `Review the key distinctions between ${a} and ${b} in your ${section} notes.`, ctx()); continue
    }

    // X because Y — cause & effect
    const becauseMatch = text.match(/^(.{8,120}?)\s+because\s+(.{8,200})$/i)
    if (becauseMatch) {
      const effect = becauseMatch[1]!.trim()
      const cause = becauseMatch[2]!.trim()
      push(`Why ${effect.charAt(0).toLowerCase() + effect.slice(1)}?`, `Because ${cause}`, ctx()); continue
    }

    // Advantages / Disadvantages / Pros / Cons header
    if (/^(advantages?|disadvantages?|pros?|cons?|benefits?|drawbacks?)/i.test(text) && text.split(' ').length < 8) {
      flushBullets()
      subsection = text
      continue
    }

    // Explicit Q&A: a line ending in ? followed by its answer on the next line
    // (handled post-loop below since it needs look-ahead)

    // Bullet / numbered list → buffer for grouped card
    if (/^[-•*+]\s/.test(rawLine.trimStart()) || /^\d+[.)]\s/.test(text)) {
      bulletBuffer.push(text.replace(/^[-•*+\d.)\s]+/, '').trim())
      continue
    }

    // Long standalone sentence → summarise card
    if (text.length > 80 && text.length < 400) {
      const preview = text.split(' ').slice(0, 6).join(' ')
      push(`Summarise: "${preview}..."`, text, ctx())
    }
  }

  flushBullets()

  // ── Post-pass: **Bold term** anywhere in body ─────────────────────────────
  const boldRe = /\*\*([^*]{3,55})\*\*/g
  let bm: RegExpExecArray | null
  while ((bm = boldRe.exec(body)) !== null) {
    const term = bm[1]!
    const after = body.substring(bm.index + bm[0].length, bm.index + bm[0].length + 260)
    const sentence = clean(after.split(/[.!?\n]/)[0] ?? '')
    if (sentence.length > 15) push(`What is "${term}"?`, sentence + '.')
  }

  // ── Post-pass: explicit Q&A lines ────────────────────────────────────────
  const cleanLines = body.split('\n').map(l => clean(l)).filter(Boolean)
  for (let i = 0; i < cleanLines.length - 1; i++) {
    const line = cleanLines[i]!
    if (line.endsWith('?') && line.length > 10 && line.length < 160) {
      const next = cleanLines[i + 1]!
      if (!next.endsWith('?') && next.length > 5) { push(line, next); i++ }
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (cards.length === 0 && body.length > 80) {
    const first = clean(body.split(/\n\n/)[0] ?? '').slice(0, 260)
    if (first.length > 20) cards.push(make(`Summarise: "${title}"`, first, title))
  }

  return cards.slice(0, 25)
}

// ─── Category picker ──────────────────────────────────────────────────────────

function CategoryPicker({ category, onChange }: { category: CategoryId | null; onChange: (c: CategoryId | null) => void }) {
  const [open, setOpen] = useState(false)
  const current = NOTE_CATEGORIES.find(c => c.id === category)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs hover:opacity-100 transition-opacity px-2.5 py-1.5"
        style={{
          border: '1px solid rgba(26,25,22,0.10)',
          color: current ? current.color : '#a8a29e',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
        }}
      >
        {current ? current.label : 'Category'}
        <span style={{ color: '#d6d3d1' }}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 20,
                backgroundColor: '#fff', border: '1px solid rgba(26,25,22,0.10)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '6px 0', minWidth: 148,
              }}
            >
              {category && (
                <button
                  onClick={() => { onChange(null); setOpen(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-stone-400 hover:bg-stone-50 transition-colors"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  None
                </button>
              )}
              {NOTE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onChange(cat.id); setOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-stone-50 transition-colors flex items-center gap-2"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: category === cat.id ? cat.color : '#78716c' }}
                >
                  {cat.label}
                  {category === cat.id && <span className="ml-auto text-stone-400 text-xs">✓</span>}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Font picker ──────────────────────────────────────────────────────────────

function FontPicker({ font, onChange }: { font: FontId; onChange: (f: FontId) => void }) {
  const [open, setOpen] = useState(false)
  const current = FONTS.find((f) => f.id === font) ?? FONTS[0]

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors px-2.5 py-1.5"
        style={{ border: '1px solid rgba(26,25,22,0.10)', fontFamily: current.css }}
      >
        {current.label}
        <span className="text-stone-300">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                zIndex: 20,
                backgroundColor: 'var(--paper, #fff)',
                border: '1px solid rgba(26,25,22,0.10)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                padding: '6px 0',
                minWidth: 130,
              }}
            >
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { onChange(f.id); setOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-stone-50 transition-colors flex items-center"
                  style={{
                    fontFamily: f.css,
                    color: font === f.id ? '#1a1916' : '#78716c',
                  }}
                >
                  {f.label}
                  {font === f.id && (
                    <span className="ml-auto text-stone-400 text-xs">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tags editor ──────────────────────────────────────────────────────────────

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')
  const { ultraMode } = useADHD()

  const addTag = () => {
    const tag = input.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setInput('')
  }

  return (
    <div
      className="flex items-center flex-wrap gap-2 px-10 py-4 shrink-0"
      style={{
        borderTop: `1px solid ${ultraMode ? 'rgba(0,255,200,0.10)' : 'rgba(26,25,22,0.06)'}`,
        backgroundColor: ultraMode ? '#0d1117' : 'transparent',
      }}
    >
      <AnimatePresence mode="popLayout">
        {tags.map((tag) => (
          <motion.span
            key={tag}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5 text-xs px-2 py-0.5"
            style={{
              backgroundColor: ultraMode ? 'rgba(0,255,200,0.08)' : 'rgba(26,25,22,0.05)',
              color: ultraMode ? '#00ffcc' : '#57534e',
              fontFamily: ultraMode ? '"Courier New", Courier, monospace' : 'Georgia, serif',
              fontStyle: ultraMode ? 'normal' : 'italic',
            }}
          >
            #{tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-stone-300 hover:text-stone-700 transition-colors leading-none"
            >
              ×
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
          if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
        }}
        onBlur={addTag}
        placeholder={tags.length === 0 ? '+ add tag' : '+'}
        className="text-xs bg-transparent outline-none"
        style={{
          fontFamily: ultraMode ? '"Courier New", Courier, monospace' : 'Georgia, serif',
          fontStyle: ultraMode ? 'normal' : 'italic',
          color: ultraMode ? '#00ffcc' : '#a8a29e',
          caretColor: ultraMode ? '#00ffcc' : undefined,
          width: 64, minWidth: 32,
        }}
      />
    </div>
  )
}

// ─── Note gallery card ────────────────────────────────────────────────────────

function NoteGalleryCard({
  note, active, isOpening, onClick, onPin, onDelete, index,
}: {
  note: Note
  active: boolean
  isOpening: boolean
  onClick: () => void
  onPin: () => void
  onDelete: () => void
  index: number
}) {
  const [coverId, setCoverId] = useState<string | null>(() => loadCover(note.id))
  const cover = getCover(coverId)
  const { ultraMode } = useADHD()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCoverModal, setShowCoverModal] = useState(false)

  const cat     = getCategoryFromTags(note.tags)
  const catCfg  = NOTE_CATEGORIES.find(c => c.id === cat)

  const defaultBg = catCfg
    ? `linear-gradient(160deg, #1e1a18 0%, #2a2420 30%, ${catCfg.color}99 100%)`
    : ultraMode
      ? 'linear-gradient(160deg, #0a0e15 0%, #111820 40%, #1c2535 100%)'
      : 'linear-gradient(160deg, #1e1a18 0%, #2e2a26 35%, #e8ddd0 100%)'

  const bgStyle = cover ? coverBgStyle(cover) : { background: defaultBg }

  const handleCoverChange = (id: string | null) => {
    setCoverId(id)
    saveCover(note.id, id)
    setMenuOpen(false)
    setShowCoverModal(false)
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: -36, scale: 0.91 }}
      animate={isOpening
        ? { y: -52, scale: 1.04, opacity: 0 }
        : { opacity: 1, y: 0, scale: 1 }
      }
      exit={{ opacity: 0, y: -20, scale: 0.94 }}
      transition={isOpening
        ? { duration: 0.21, ease: [0.4, 0, 1, 1] }
        : { type: 'spring', stiffness: 320, damping: 26, delay: Math.min(index * 0.04, 0.28) }
      }
      whileHover={isOpening ? {} : { y: -14, scale: 1.05, zIndex: 20 }}
      onClick={onClick}
      style={{
        flex: '0 0 192px',
        height: 268,
        position: 'relative',
        marginLeft: index === 0 ? 0 : -40,
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: active ? 15 : 1,
        boxShadow: active
          ? `0 20px 48px rgba(0,0,0,0.42), 0 0 0 2px ${ultraMode ? '#00ffcc' : '#1a1916'}, 0 0 0 4px ${ultraMode ? 'rgba(0,255,200,0.12)' : 'rgba(26,25,22,0.08)'}`
          : ultraMode
            ? '0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,255,200,0.14), 4px 0 0 0 rgba(0,255,200,0.06) inset'
            : '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08), 2px 0 0 0 rgba(26,25,22,0.05) inset',
        ...bgStyle,
      }}
    >
      {/* Scrim: bottom gradient for text legibility */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 42%, rgba(0,0,0,0.76) 100%)',
      }} />

      {/* Bottom text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px 14px' }}>
        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: 13, lineHeight: 1.35, margin: 0,
          color: '#fff',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          textShadow: '0 1px 6px rgba(0,0,0,0.6)',
        }}>
          {note.title || 'Untitled'}
        </p>
        {catCfg && (
          <span style={{
            fontSize: 9, display: 'block', marginTop: 4,
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            letterSpacing: '0.06em',
          }}>
            {catCfg.label}
          </span>
        )}
      </div>

      {/* Pin badge */}
      {note.is_pinned && (
        <div style={{ position: 'absolute', top: 8, left: 8, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#c9a84c', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
      )}

      {/* ⋯ menu */}
      <div style={{ position: 'absolute', top: 6, right: 6 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          ⋯
        </button>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.11 }}
                style={{
                  position: 'absolute', top: 30, right: 0, zIndex: 40,
                  backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 8, overflow: 'hidden', minWidth: 148,
                }}
              >
                {[
                  { label: 'Change cover', action: () => { setMenuOpen(false); setShowCoverModal(true) } },
                  { label: note.is_pinned ? 'Unpin' : 'Pin', action: () => { onPin(); setMenuOpen(false) } },
                  { label: 'Delete', action: () => { onDelete(); setMenuOpen(false) }, danger: true },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 14px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: (item as { danger?: boolean }).danger ? '#ff5555' : '#ccc',
                      fontSize: 12, fontFamily: 'Georgia, serif', fontStyle: 'italic',
                      display: 'block',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>

    {/* Cover picker — portal so it isn't clipped by the card's overflow:hidden */}
    {showCoverModal && typeof document !== 'undefined' && createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(14px) saturate(0.7)',
          backgroundColor: 'rgba(10,8,6,0.55)',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowCoverModal(false) }}
      >
        <div style={{
          backgroundColor: '#1a1614', width: 420, borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontFamily: 'Georgia, serif', margin: 0 }}>
              Change cover
            </p>
            <button
              onClick={() => setShowCoverModal(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}
            >
              ×
            </button>
          </div>
          <CoverGrid current={coverId} onSelect={handleCoverChange} dark columns={5} />
        </div>
      </div>,
      document.body
    )}
    </>
  )
}

// ─── Note editor ──────────────────────────────────────────────────────────────

function NoteEditor({
  note,
  onClose,
  onSave,
  initialCoverId,
  initialCategory,
  initialTitle,
}: {
  note: Note | null
  onClose: () => void
  onSave: (id: string | null, title: string, body: string, tags: string[]) => void
  initialCoverId?: string | null
  initialCategory?: CategoryId | null
  initialTitle?: string
}) {
  const [title, setTitleState] = useState(
    note?.title === 'Untitled' ? '' : (note?.title ?? initialTitle ?? '')
  )
  const [body, setBodyState] = useState(() => note ? extractText(note) : '')
  const [tags, setTagsState] = useState<string[]>(() => {
    const base = note?.tags.filter((t) => !t.startsWith('__')) ?? []
    return initialCategory ? setCategoryOnTags(base, initialCategory) : base
  })
  const [font, setFont] = useState<FontId>(() => {
    if (typeof window === 'undefined') return 'serif'
    return (localStorage.getItem(`maable-note-font-${note?.id ?? 'new'}`) as FontId | null) ?? 'serif'
  })
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [tab, setTab] = useState<'write' | 'preview' | 'cards'>('write')
  const [cards, setCards] = useState<FlashCard[]>(() => note?.id ? loadCards(note.id) : [])
  const [revising, setRevising] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedRef = useRef(false)
  const { adhdMode, ultraMode } = useADHD()
  const keyCountRef = useRef(0)
  const [coverId] = useState<string | null>(() =>
    note?.id ? loadCover(note.id) : (initialCoverId ?? null)
  )

  // Refs for debounced save closure
  const titleRef = useRef(title)
  const bodyRef = useRef(body)
  const tagsRef = useRef(tags)
  titleRef.current = title
  bodyRef.current = body
  tagsRef.current = tags

  const fontConfig = FONTS.find((f) => f.id === font) ?? FONTS[0]
  const isItalicFont = font === 'serif' || font === 'literary'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`maable-note-font-${note?.id ?? 'new'}`, font)
    }
  }, [font, note?.id])

  const triggerSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      onSave(note?.id ?? null, titleRef.current, bodyRef.current, tagsRef.current)
      savedRef.current = true
    }, 800)
  }, [note?.id, onSave])

  // Persist cover to localStorage once a new note gets its first ID
  useEffect(() => {
    if (note?.id && coverId) saveCover(note.id, coverId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id])

  const handleCardsChange = useCallback((updated: FlashCard[]) => {
    setCards(updated)
    if (note?.id) persistCards(note.id, updated)
  }, [note?.id])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      // Only flush for existing notes — createNote is NOT idempotent so we never call it on unmount
      if (note?.id && !savedRef.current) {
        onSave(note.id, titleRef.current, bodyRef.current, tagsRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTitle = (v: string) => { titleRef.current = v; setTitleState(v) }
  const setBody = (v: string) => { bodyRef.current = v; setBodyState(v) }
  const setTags = (v: string[]) => { tagsRef.current = v; setTagsState(v) }

  // Insert markdown formatting with selection preservation
  const insertFormat = useCallback((wrap: [string, string] | string) => {
    const ta = textareaRef.current
    if (!ta) return
    const cur = bodyRef.current
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = cur.substring(start, end)

    let newBody: string, ns: number, ne: number

    if (typeof wrap === 'string') {
      // Line-prefix toggle (heading)
      const lineStart = cur.lastIndexOf('\n', start - 1) + 1
      const has = cur.substring(lineStart).startsWith(wrap)
      if (has) {
        newBody = cur.substring(0, lineStart) + cur.substring(lineStart + wrap.length)
        ns = Math.max(lineStart, start - wrap.length)
        ne = Math.max(lineStart, end - wrap.length)
      } else {
        newBody = cur.substring(0, lineStart) + wrap + cur.substring(lineStart)
        ns = start + wrap.length
        ne = end + wrap.length
      }
    } else {
      const [open, close] = wrap
      newBody = cur.substring(0, start) + open + selected + close + cur.substring(end)
      ns = start + open.length
      ne = selected ? end + open.length : ns
    }

    // Directly mutate DOM value — React skips the DOM update if value matches, preserving the selection we set next
    ta.value = newBody
    ta.setSelectionRange(ns, ne)
    setBody(newBody)
    triggerSave()
  }, [triggerSave])

  const insertText = useCallback((text: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const cur = bodyRef.current
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newBody = cur.substring(0, start) + text + cur.substring(end)
    ta.value = newBody
    const pos = start + text.length
    ta.setSelectionRange(pos, pos)
    setBody(newBody)
    triggerSave()
  }, [triggerSave])

  const handleCopy = () => {
    navigator.clipboard.writeText(`${titleRef.current}\n\n${bodyRef.current}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShare = () => {
    const t = titleRef.current || 'Untitled'
    const b = bodyRef.current
    const text = `${t}\n${'─'.repeat(Math.min(t.length, 40))}\n\n${b}\n\n— from Maable`
    navigator.clipboard.writeText(text).then(() => {
      setShared(true)
      setTimeout(() => setShared(false), 2500)
    })
  }

  const handleExportPdf = () => {
    const pw = window.open('', '_blank')
    if (!pw) return
    const t = titleRef.current || 'Untitled'
    const b = bodyRef.current
    const tgs = tagsRef.current
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const tagLine = tgs.length ? `  ·  ${tgs.map((g) => `#${escHtml(g)}`).join('  ')}` : ''

    pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escHtml(t)}</title>
  <style>
    @page { margin: 2.2cm 2.8cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${fontConfig.css}; font-size: 11.5pt; line-height: 1.85; color: #1a1916; }
    h1 { font-size: 20pt; font-style: ${isItalicFont ? 'italic' : 'normal'}; font-weight: normal; margin-bottom: 6pt; line-height: 1.2; }
    .meta { font-size: 9pt; color: #9d9289; border-bottom: 1px solid #e5e0d8; padding-bottom: 14pt; margin-bottom: 20pt; }
    .body { white-space: pre-wrap; word-break: break-word; }
    .footer { position: fixed; bottom: 1.2cm; right: 2.8cm; font-size: 8pt; color: #c8c3bb; font-style: italic; }
  </style>
</head>
<body>
  <h1>${escHtml(t)}</h1>
  <div class="meta">${date}${tagLine}</div>
  <div class="body">${escHtml(b)}</div>
  <div class="footer">Maable</div>
</body>
</html>`)
    pw.document.close()
    pw.focus()
    setTimeout(() => { pw.print(); pw.close() }, 300)
  }

  const words = wordCount(body)
  const today = new Date().toISOString().slice(0, 10)
  const dueCount = cards.filter(c => !c.due || c.due <= today).length

  return (
    <motion.div
      key="editor"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="flex flex-col h-full"
      style={{ backgroundColor: ultraMode ? '#0d1117' : 'transparent' }}
    >
      <AnimatePresence>
        {revising && (
          <RevisionMode
            cards={cards}
            onClose={() => setRevising(false)}
            onUpdate={handleCardsChange}
          />
        )}
      </AnimatePresence>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-10 pt-6 pb-4 shrink-0"
        style={{
          borderBottom: `1px solid ${ultraMode ? 'rgba(0,255,200,0.12)' : 'rgba(26,25,22,0.06)'}`,
          backgroundColor: ultraMode ? '#0d1117' : 'transparent',
        }}
      >
        {/* Back */}
        <button
          onClick={onClose}
          className="text-xs text-stone-400 hover:text-stone-700 transition-colors shrink-0"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          ← Notes
        </button>

        {/* Font + category */}
        <div className="flex items-center gap-3 flex-1">
          {tab === 'write' && !ultraMode && <FontPicker font={font} onChange={setFont} />}
          {tab === 'write' && (
            <CategoryPicker
              category={getCategoryFromTags(tags)}
              onChange={(cat) => { const newTags = setCategoryOnTags(tags, cat); setTags(newTags); triggerSave() }}
            />
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center shrink-0" style={{ border: '1px solid rgba(26,25,22,0.10)', padding: 2, gap: 2 }}>
          {(['write', 'preview', 'cards'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-3 py-1 text-xs transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: tab === t ? '#1a1916' : '#a8a29e', backgroundColor: tab === t ? 'rgba(26,25,22,0.08)' : 'transparent' }}>
              {t === 'write' ? 'Write' : t === 'preview' ? 'Preview' : 'Cards'}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 shrink-0" style={{ borderLeft: '1px solid rgba(26,25,22,0.08)', paddingLeft: 12 }}>
          {tab === 'write' && (
            <span className="text-xs text-stone-300 tabular-nums mr-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {words}w
            </span>
          )}
          {tab === 'cards' ? (
            <button onClick={() => setRevising(true)} disabled={dueCount === 0} className="text-xs transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', border: '1px solid rgba(26,25,22,0.14)', padding: '3px 10px', color: dueCount > 0 ? '#1a1916' : '#a8a29e' }}>
              {dueCount > 0 ? `Revise (${dueCount})` : 'All caught up'}
            </button>
          ) : (
            <>
              <button onClick={handleShare} className="text-xs transition-colors"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: shared ? '#16a34a' : '#78716c' }}>
                {shared ? 'Copied!' : 'Share'}
              </button>
              <button onClick={handleCopy} className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleExportPdf} className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Formatting sub-bar (write tab only) ──────────────────────────────── */}
      {tab === 'write' && (
        <div
          className="flex items-center shrink-0 px-10 py-1"
          style={{ borderBottom: `1px solid ${ultraMode ? 'rgba(0,255,200,0.06)' : 'rgba(26,25,22,0.05)'}`, gap: 1 }}
        >
          {/* Headings */}
          {[
            { label: 'H1', action: () => insertFormat('# '),  title: 'Heading 1' },
            { label: 'H2', action: () => insertFormat('## '), title: 'Heading 2' },
            { label: 'H3', action: () => insertFormat('### '), title: 'Heading 3' },
          ].map(b => (
            <button key={b.label} title={b.title} onClick={b.action}
              className="px-2 h-6 text-xs transition-colors font-mono"
              style={{ color: ultraMode ? 'rgba(0,255,200,0.4)' : '#a8a29e' }}
              onMouseEnter={e => (e.currentTarget.style.color = ultraMode ? '#00ffcc' : '#1a1916')}
              onMouseLeave={e => (e.currentTarget.style.color = ultraMode ? 'rgba(0,255,200,0.4)' : '#a8a29e')}>
              {b.label}
            </button>
          ))}
          <div className="w-px h-3.5 mx-1" style={{ background: ultraMode ? 'rgba(0,255,200,0.12)' : 'rgba(26,25,22,0.10)' }} />
          {/* Inline */}
          {[
            { label: 'B', action: () => insertFormat(['**','**'] as [string,string]), title: 'Bold (Cmd+B)', style: 'font-bold' },
            { label: 'I', action: () => insertFormat(['_','_'] as [string,string]),   title: 'Italic (Cmd+I)', style: 'italic' },
            { label: 'S', action: () => insertFormat(['~~','~~'] as [string,string]), title: 'Strikethrough', style: 'line-through' },
          ].map(b => (
            <button key={b.label} title={b.title} onClick={b.action}
              className={`w-6 h-6 flex items-center justify-center text-xs transition-colors ${b.style}`}
              style={{ color: ultraMode ? 'rgba(0,255,200,0.4)' : '#a8a29e' }}
              onMouseEnter={e => (e.currentTarget.style.color = ultraMode ? '#00ffcc' : '#1a1916')}
              onMouseLeave={e => (e.currentTarget.style.color = ultraMode ? 'rgba(0,255,200,0.4)' : '#a8a29e')}>
              {b.label}
            </button>
          ))}
          <div className="w-px h-3.5 mx-1" style={{ background: ultraMode ? 'rgba(0,255,200,0.12)' : 'rgba(26,25,22,0.10)' }} />
          {/* Block */}
          {[
            { label: 'Bullet',    sym: '•',   action: () => insertFormat('- '),   title: 'Bullet list' },
            { label: 'Numbered',  sym: '1.',   action: () => insertFormat('1. '),  title: 'Numbered list' },
            { label: 'Quote',     sym: '"',    action: () => insertFormat('> '),   title: 'Blockquote' },
            { label: 'Code',      sym: '</>',  action: () => insertFormat(['`','`'] as [string,string]), title: 'Inline code' },
            { label: 'Divider',   sym: '—',    action: () => insertText('\n\n---\n\n'), title: 'Horizontal rule' },
          ].map(b => (
            <button key={b.label} title={b.title} onClick={b.action}
              className="px-1.5 h-6 text-xs transition-colors font-mono"
              style={{ color: ultraMode ? 'rgba(0,255,200,0.4)' : '#a8a29e' }}
              onMouseEnter={e => (e.currentTarget.style.color = ultraMode ? '#00ffcc' : '#1a1916')}
              onMouseLeave={e => (e.currentTarget.style.color = ultraMode ? 'rgba(0,255,200,0.4)' : '#a8a29e')}>
              {b.sym}
            </button>
          ))}
        </div>
      )}

      {tab === 'write' ? (
        <>
          {/* ── Title ──────────────────────────────────────────────────────────── */}
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); triggerSave() }}
            placeholder={ultraMode ? '// untitled' : 'Untitled'}
            className="mx-10 mt-6 mb-4 text-2xl bg-transparent outline-none placeholder:text-stone-200 shrink-0"
            style={{
              fontFamily: ultraMode ? '"Courier New", Courier, monospace' : fontConfig.css,
              fontStyle: ultraMode ? 'normal' : (isItalicFont ? 'italic' : 'normal'),
              color: ultraMode ? '#9cdcfe' : '#1a1916',
              caretColor: ultraMode ? '#00ffcc' : undefined,
              textShadow: ultraMode ? '0 0 8px rgba(156,220,254,0.3)' : 'none',
            }}
          />

          <div className="mx-10 h-px shrink-0 mb-5" style={{ backgroundColor: ultraMode ? 'rgba(0,255,200,0.10)' : 'rgba(26,25,22,0.07)' }} />

          {/* ── Body ───────────────────────────────────────────────────────────── */}
          <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: ultraMode ? '#0d1117' : 'transparent' }}>
            {/* IDE line numbers (ultra only) */}
            {ultraMode && (
              <LineNumbers text={body} lineHeight={28} />
            )}
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => { setBody(e.target.value); triggerSave() }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); insertFormat(['**', '**']) }
                if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); insertFormat(['_', '_']) }
                if (adhdMode && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
                  keyCountRef.current++
                  const ta = textareaRef.current
                  if (ta) {
                    const rect = ta.getBoundingClientRect()
                    const x = rect.left + Math.random() * Math.min(rect.width * 0.6, 200)
                    const y = rect.top + Math.random() * Math.min(rect.height * 0.5, 100)
                    typeSpark(x, y)
                    playType()
                    if (keyCountRef.current % 5 === 0) scrambleGhost(ta)
                  }
                }
              }}
              placeholder={ultraMode ? '// start typing...' : 'Write something...'}
              className="absolute inset-0 text-sm bg-transparent outline-none resize-none leading-7"
              style={{
                fontFamily: ultraMode ? '"Courier New", Courier, monospace' : fontConfig.css,
                color: ultraMode ? '#d4d4d4' : '#374151',
                caretColor: ultraMode ? '#00ffcc' : (adhdMode ? '#ff6b6b' : undefined),
                paddingLeft: ultraMode ? 64 : 40,
                paddingRight: 40,
                paddingTop: 0,
                paddingBottom: 40,
                lineHeight: '28px',
              }}
            />
            {/* IDE status bar */}
            {ultraMode && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 24,
                backgroundColor: '#007acc', display: 'flex', alignItems: 'center',
                paddingLeft: 64, paddingRight: 16, gap: 16,
                fontFamily: '"Courier New", Courier, monospace', fontSize: 11,
                color: 'rgba(255,255,255,0.85)',
              }}>
                <span>Maable IDE</span>
                <span>·</span>
                <span>{body.split('\n').length} lines</span>
                <span>·</span>
                <span>{wordCount(body)} words</span>
                <span>·</span>
                <span>UTF-8</span>
                <span style={{ marginLeft: 'auto' }}>Markdown</span>
              </div>
            )}
          </div>

          {/* ── Tags ───────────────────────────────────────────────────────────── */}
          <TagsEditor
            tags={tags}
            onChange={(newTags) => { setTags(newTags); triggerSave() }}
          />
        </>
      ) : tab === 'preview' ? (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', backgroundColor: ultraMode ? '#0d1117' : 'transparent' }}>
          <style>{`
            .md-preview .md-h1,.md-preview-ultra .md-h1{font-size:1.75rem;font-weight:400;font-style:italic;margin:1.4em 0 0.5em;line-height:1.2;}
            .md-preview .md-h2,.md-preview-ultra .md-h2{font-size:1.3rem;font-weight:400;font-style:italic;margin:1.2em 0 0.4em;}
            .md-preview .md-h3,.md-preview-ultra .md-h3{font-size:1.05rem;font-weight:600;margin:1em 0 0.3em;}
            .md-preview .md-p{margin:0.6em 0;line-height:1.8;color:#374151;}
            .md-preview .md-ul,.md-preview .md-ol,.md-preview-ultra .md-ul,.md-preview-ultra .md-ol{padding-left:1.5em;margin:0.5em 0;}
            .md-preview .md-ul,.md-preview-ultra .md-ul{list-style-type:disc;}
            .md-preview .md-ol,.md-preview-ultra .md-ol{list-style-type:decimal;}
            .md-preview li,.md-preview-ultra li{margin:0.25em 0;line-height:1.75;}
            .md-preview .md-bq{border-left:3px solid rgba(26,25,22,0.18);margin:0.8em 0;padding:0.15em 1em;color:#78716c;font-style:italic;}
            .md-preview .md-code{font-family:"Courier New",monospace;font-size:0.84em;background:rgba(26,25,22,0.07);padding:0.1em 0.36em;border-radius:3px;color:#1a1916;}
            .md-preview .md-pre{background:rgba(26,25,22,0.04);border:1px solid rgba(26,25,22,0.09);border-radius:4px;padding:0.85em 1em;margin:0.9em 0;overflow-x:auto;}
            .md-preview .md-pre code{background:none;padding:0;font-size:0.82em;color:#374151;}
            .md-preview .md-hr{border:none;border-top:1px solid rgba(26,25,22,0.11);margin:1.5em 0;}
            .md-preview .md-link{color:#3b82f6;text-decoration:underline;}
            .md-preview-ultra .md-h1,.md-preview-ultra .md-h2,.md-preview-ultra .md-h3{color:#9cdcfe;font-style:normal;font-family:"Courier New",monospace;}
            .md-preview-ultra .md-p{margin:0.6em 0;line-height:1.8;color:#d4d4d4;}
            .md-preview-ultra li{color:#d4d4d4;}
            .md-preview-ultra .md-bq{border-left:3px solid rgba(0,255,200,0.25);margin:0.8em 0;padding:0.15em 1em;color:rgba(0,255,200,0.55);}
            .md-preview-ultra .md-code{font-family:"Courier New",monospace;font-size:0.84em;background:rgba(0,255,200,0.08);padding:0.1em 0.36em;color:#00ffcc;}
            .md-preview-ultra .md-pre{background:#0a0f16;border:1px solid rgba(0,255,200,0.14);border-radius:4px;padding:0.85em 1em;margin:0.9em 0;overflow-x:auto;}
            .md-preview-ultra .md-pre code{background:none;padding:0;font-size:0.82em;color:#d4d4d4;}
            .md-preview-ultra .md-hr{border:none;border-top:1px solid rgba(0,255,200,0.14);margin:1.5em 0;}
            .md-preview-ultra .md-link{color:#00ffcc;text-decoration:underline;}
          `}</style>
          <div
            className={ultraMode ? 'md-preview-ultra' : 'md-preview'}
            style={{
              marginLeft: 40, marginRight: 40, paddingTop: 32, paddingBottom: 56,
              maxWidth: 700,
              fontFamily: ultraMode ? '"Courier New", Courier, monospace' : fontConfig.css,
              color: ultraMode ? '#d4d4d4' : '#374151',
              fontSize: '0.935rem',
            }}
          >
            <h1 style={{
              fontFamily: ultraMode ? '"Courier New", Courier, monospace' : fontConfig.css,
              fontStyle: (!ultraMode && isItalicFont) ? 'italic' : 'normal',
              fontWeight: 400, lineHeight: 1.2, marginBottom: '0.35em',
              color: ultraMode ? '#9cdcfe' : '#1a1916',
              fontSize: ultraMode ? '1.55rem' : '1.9rem',
            }}>
              {title || 'Untitled'}
            </h1>
            <div style={{ height: 1, backgroundColor: ultraMode ? 'rgba(0,255,200,0.10)' : 'rgba(26,25,22,0.07)', marginBottom: '1.6em' }} />
            {body.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
            ) : (
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: ultraMode ? 'rgba(0,255,200,0.25)' : '#d6d3d1', fontSize: '0.9rem' }}>
                Nothing written yet.
              </p>
            )}
          </div>
        </div>
      ) : (
        <FlashcardsPanel
          cards={cards}
          onChange={handleCardsChange}
          title={title}
          body={body}
          category={getCategoryFromTags(tags)}
        />
      )}
    </motion.div>
  )
}

// ─── New note setup ───────────────────────────────────────────────────────────

interface NewNoteOpts { coverId: string | null; category: CategoryId | null; title: string }

function NewNoteSetup({
  onStart,
  onCancel,
}: {
  onStart: (opts: NewNoteOpts) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [coverId, setCoverId] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryId | null>(null)
  const { ultraMode } = useADHD()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const cover = getCover(coverId)

  useEffect(() => { titleInputRef.current?.focus() }, [])

  const coverPreviewStyle = cover
    ? coverBgStyle(cover)
    : { background: 'linear-gradient(160deg, #1e1a18 0%, #2e2a26 40%, #e8ddd0 100%)' }

  const handleStart = () => onStart({ coverId, category, title })

  /* ── Ultra mode ── */
  if (ultraMode) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(20px) saturate(0.5)',
          backgroundColor: 'rgba(3,8,14,0.82)',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.90, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          style={{
            width: 560, backgroundColor: '#0d1117',
            border: '1px solid rgba(0,255,200,0.20)',
            boxShadow: '0 0 0 1px rgba(0,255,200,0.06), 0 32px 80px rgba(0,0,0,0.9)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid rgba(0,255,200,0.12)' }}>
            <div style={{ width: 44, flexShrink: 0, ...coverPreviewStyle, transition: 'background 0.3s' }} />
            <div style={{ flex: 1, padding: '14px 16px 12px' }}>
              <p style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(0,255,200,0.35)', fontFamily: '"Courier New", monospace', margin: '0 0 6px' }}>// new_note.md</p>
              <input ref={titleInputRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleStart() }}
                placeholder="note_title..." style={{ background: 'none', border: 'none', outline: 'none', fontFamily: '"Courier New", monospace', fontSize: 18, color: '#d4d4d4', width: '100%', caretColor: '#00ffcc' }} />
            </div>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,255,200,0.3)', fontSize: 18, padding: '14px 16px', alignSelf: 'flex-start' }}>×</button>
          </div>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,255,200,0.08)' }}>
            <p style={{ fontSize: 8, letterSpacing: '0.16em', color: 'rgba(0,255,200,0.3)', fontFamily: '"Courier New", monospace', marginBottom: 10 }}>&gt; COVER</p>
            <CoverGrid current={coverId} onSelect={setCoverId} compact dark columns={6} />
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {NOTE_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategory(category === cat.id ? null : cat.id)}
                  style={{ padding: '3px 10px', fontSize: 10, cursor: 'pointer', fontFamily: '"Courier New", monospace', border: `1px solid ${category === cat.id ? cat.color : 'rgba(0,255,200,0.14)'}`, color: category === cat.id ? cat.color : 'rgba(0,255,200,0.35)', backgroundColor: category === cat.id ? `${cat.color}18` : 'transparent' }}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 12 }}>
              <motion.button onClick={handleStart} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                style={{ padding: '7px 20px', fontSize: 11, cursor: 'pointer', fontFamily: '"Courier New", monospace', border: '1px solid #00ffcc', color: '#00ffcc', backgroundColor: 'rgba(0,255,200,0.08)', letterSpacing: '0.08em' }}>
                &gt; Begin
              </motion.button>
              <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'rgba(0,255,200,0.3)', fontFamily: '"Courier New", monospace' }}>ESC</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  /* ── Regular mode: white + charcoal ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(20px) saturate(0.65)',
        backgroundColor: 'rgba(26,22,18,0.38)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.91, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        style={{
          width: 640,
          backgroundColor: '#faf8f5',
          border: '1px solid rgba(26,25,22,0.10)',
          boxShadow: '0 2px 8px rgba(26,25,22,0.06), 0 20px 60px rgba(26,25,22,0.18), 0 48px 100px rgba(26,25,22,0.12)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header: cover swatch + title */}
        <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid rgba(26,25,22,0.08)' }}>
          {/* Live cover mini-card */}
          <div style={{
            width: 52, flexShrink: 0, minHeight: 86,
            ...coverPreviewStyle, transition: 'all 0.3s',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 50%, rgba(26,25,22,0.06) 100%)' }} />
          </div>
          {/* Title input */}
          <div style={{ flex: 1, padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
            <p style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.35)', fontFamily: 'Georgia, serif', margin: 0 }}>New note</p>
            <input
              ref={titleInputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleStart() }}
              placeholder="Untitled..."
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: 22, color: '#1a1916', width: '100%',
                caretColor: '#1a1916',
              }}
            />
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,25,22,0.28)', fontSize: 20, padding: '18px 20px', alignSelf: 'flex-start', lineHeight: 1 }}>×</button>
        </div>

        {/* Cover picker */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(26,25,22,0.07)' }}>
          <p style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.35)', fontFamily: 'Georgia, serif', marginBottom: 10 }}>Cover</p>
          <CoverGrid current={coverId} onSelect={setCoverId} compact columns={6} />
        </div>

        {/* Footer: categories + actions */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flex: 1 }}>
            {NOTE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(category === cat.id ? null : cat.id)}
                style={{
                  padding: '4px 11px', fontSize: 11, cursor: 'pointer',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  border: `1px solid ${category === cat.id ? cat.color : 'rgba(26,25,22,0.12)'}`,
                  color: category === cat.id ? cat.color : 'rgba(26,25,22,0.45)',
                  backgroundColor: category === cat.id ? `${cat.color}12` : 'transparent',
                  transition: 'all 0.12s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <motion.button
              onClick={handleStart}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              style={{
                padding: '8px 22px', fontSize: 12, cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                backgroundColor: '#1a1916', color: '#faf8f5', border: 'none',
              }}
            >
              Begin
            </motion.button>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(26,25,22,0.38)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function NotesClient({ notes: initialNotes }: { notes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [activeId, setActiveId] = useState<string | 'new' | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [newNoteOpts, setNewNoteOpts] = useState<NewNoteOpts | null>(null)
  const [filter, setFilter] = useState<'all' | 'pinned'>('all')
  const [search, setSearch] = useState('')

  const { ultraMode } = useADHD()

  const activeNote = activeId && activeId !== 'new'
    ? notes.find((n) => n.id === activeId) ?? null
    : null


  const filtered = notes.filter((n) => {
    if (filter === 'pinned' && !n.is_pinned) return false
    if (search) {
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) || (n.content_text ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const pinned = filtered.filter((n) => n.is_pinned)
  const rest = filtered.filter((n) => !n.is_pinned)

  const handleSave = useCallback(async (id: string | null, title: string, body: string, tags: string[]) => {
    if (id) {
      await updateNote(id, { title, body, tags })
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, title: title || 'Untitled', content_text: body, tags, updated_at: new Date().toISOString() }
            : n
        )
      )
    } else {
      const { id: newId } = await createNote({ title, body, tags })
      if (newId) {
        const newNote: Note = {
          id: newId,
          user_id: '',
          project_id: null,
          task_id: null,
          title: title || 'Untitled',
          content: {},
          content_text: body,
          tags,
          is_pinned: false,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setNotes((prev) => [newNote, ...prev])
        setActiveId(newId)
      }
    }
  }, [])

  const handlePin = useCallback(async (note: Note) => {
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n))
    await togglePin(note.id, note.is_pinned)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (activeId === id) setActiveId(null)
    await deleteNote(id)
  }, [activeId])

  const openNewNote = useCallback(() => {
    setNewNoteOpts(null)
    setActiveId('new')
  }, [])

  const handleCardOpen = useCallback((id: string) => {
    setOpeningId(id)
    setTimeout(() => {
      setActiveId(id)
      setOpeningId(null)
    }, 230)
  }, [])

  // Only show non-system tags in sidebar
  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags.filter((t) => !t.startsWith('__'))))
  ).slice(0, 8)

  return (
    <div
      className="flex h-[calc(100dvh-4.5rem)] overflow-hidden"
      style={{ backgroundColor: ultraMode ? '#050d14' : 'var(--paper, #fff)' }}
    >
      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 py-8 pl-10 pr-6"
        style={{
          width: 260,
          borderRight: `1px solid ${ultraMode ? 'rgba(0,255,200,0.12)' : 'rgba(26,25,22,0.07)'}`,
          backgroundColor: ultraMode ? '#0c1219' : 'transparent',
        }}
      >
        <h1
          className="text-4xl mb-2 leading-none"
          style={{
            fontFamily: ultraMode ? '"Courier New", Courier, monospace' : 'Georgia, serif',
            fontStyle: ultraMode ? 'normal' : 'italic',
            color: ultraMode ? '#9cdcfe' : '#1c1917',
            textShadow: ultraMode ? '0 0 12px rgba(156,220,254,0.3)' : 'none',
          }}
        >
          {ultraMode ? '// Notes' : 'Notes'}
        </h1>
        <p className="text-sm mb-6" style={{ color: ultraMode ? 'rgba(0,255,200,0.4)' : '#a8a29e', fontFamily: ultraMode ? '"Courier New", monospace' : undefined }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </p>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 mb-5"
          style={{ border: `1px solid ${ultraMode ? 'rgba(0,255,200,0.15)' : 'rgba(26,25,22,0.10)'}` }}
        >
          <span className="text-sm" style={{ color: ultraMode ? 'rgba(0,255,200,0.4)' : '#d6d3d1' }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 text-xs bg-transparent outline-none"
            style={{
              fontFamily: ultraMode ? '"Courier New", Courier, monospace' : 'Georgia, serif',
              fontStyle: ultraMode ? 'normal' : 'italic',
              color: ultraMode ? '#d4d4d4' : '#44403c',
              caretColor: ultraMode ? '#00ffcc' : undefined,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-sm leading-none" style={{ color: ultraMode ? '#00ffcc' : '#d6d3d1' }}>
              ×
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-col gap-1.5 mb-6">
          {(['all', 'pinned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-left px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: filter === f
                  ? (ultraMode ? 'rgba(0,255,200,0.12)' : 'var(--ink, #1a1916)')
                  : 'transparent',
                color: filter === f
                  ? (ultraMode ? '#00ffcc' : 'var(--paper, #fff)')
                  : (ultraMode ? 'rgba(0,255,200,0.35)' : '#78716c'),
                fontFamily: ultraMode ? '"Courier New", Courier, monospace' : 'Georgia, serif',
                fontStyle: ultraMode ? 'normal' : 'italic',
                border: ultraMode && filter === f ? '1px solid rgba(0,255,200,0.3)' : '1px solid transparent',
              }}
            >
              {f === 'all' ? 'All notes' : 'Pinned'}
            </button>
          ))}
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="mb-6">
            <p className="text-xs mb-2 px-3" style={{ color: ultraMode ? 'rgba(0,255,200,0.3)' : '#d6d3d1', fontFamily: ultraMode ? '"Courier New", monospace' : undefined }}>Tags</p>
            <div className="flex flex-col gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="text-left text-xs transition-colors px-3 py-1"
                  style={{
                    fontFamily: ultraMode ? '"Courier New", Courier, monospace' : 'Georgia, serif',
                    fontStyle: ultraMode ? 'normal' : 'italic',
                    color: ultraMode ? 'rgba(0,255,200,0.5)' : '#78716c',
                  }}
                >
                  # {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* New note shortcut */}
        <button
          onClick={() => openNewNote()}
          className="flex items-center gap-2 text-sm transition-colors mb-4 px-3"
          style={{
            fontFamily: ultraMode ? '"Courier New", Courier, monospace' : 'Georgia, serif',
            fontStyle: ultraMode ? 'normal' : 'italic',
            color: ultraMode ? 'rgba(0,255,200,0.5)' : '#78716c',
          }}
        >
          <span style={{
            width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, lineHeight: 1,
            border: `1px solid ${ultraMode ? 'rgba(0,255,200,0.25)' : '#d6d3d1'}`,
            borderRadius: ultraMode ? 2 : 0,
          }}>
            +
          </span>
          New note
        </button>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Editor: replaces gallery entirely */}
          {activeId !== null && (activeId !== 'new' || newNoteOpts !== null) ? (
            <NoteEditor
              key={activeId ?? 'new'}
              note={activeId === 'new' ? null : activeNote}
              onClose={() => { setActiveId(null); setNewNoteOpts(null) }}
              onSave={handleSave}
              {...(activeId === 'new' && newNoteOpts ? {
                initialCoverId: newNoteOpts.coverId,
                initialCategory: newNoteOpts.category,
                initialTitle: newNoteOpts.title,
              } : {})}
            />
          ) : (
            /* Gallery view — stays visible; setup popup floats on top */
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
              style={{ backgroundColor: ultraMode ? '#050d14' : 'transparent', position: 'relative' }}
            >
            {/* Gallery content — dims when setup popup is open */}
            <motion.div
              className="flex flex-col h-full"
              animate={{
                opacity: activeId === 'new' ? 0.15 : 1,
                scale: activeId === 'new' ? 0.985 : 1,
              }}
              transition={{ duration: 0.2 }}
              style={{ pointerEvents: activeId === 'new' ? 'none' : 'auto' }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-end px-12 pt-6 pb-3 shrink-0">
                <button
                  onClick={() => openNewNote()}
                  className="flex items-center gap-2 text-sm transition-colors"
                  style={{
                    fontFamily: ultraMode ? '"Courier New", Courier, monospace' : 'Georgia, serif',
                    fontStyle: ultraMode ? 'normal' : 'italic',
                    color: ultraMode ? 'rgba(0,255,200,0.65)' : '#78716c',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                    border: `1px solid ${ultraMode ? 'rgba(0,255,200,0.35)' : '#d6d3d1'}`,
                    borderRadius: ultraMode ? 2 : '50%',
                  }}>
                    +
                  </span>
                  New note
                </button>
              </div>

              {/* ── Gallery ───────────────────────────────────────────────── */}
              <div className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
                {/* Shelf line — sits at paddingTop(52) + cardHeight(268) = 320px from top */}
                {filtered.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 320, left: 0, right: 0, height: 1, zIndex: 0,
                    background: ultraMode
                      ? 'linear-gradient(90deg, transparent 0%, rgba(0,255,200,0.10) 8%, rgba(0,255,200,0.20) 50%, transparent 100%)'
                      : 'linear-gradient(90deg, transparent 0%, rgba(26,25,22,0.07) 8%, rgba(26,25,22,0.14) 50%, transparent 100%)',
                  }} />
                )}
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 pb-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/illustrations/chibi-tired.png"
                      alt=""
                      className="w-28 h-28 object-contain opacity-40"
                      draggable={false}
                    />
                    <p
                      className="text-sm"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: ultraMode ? 'rgba(0,255,200,0.35)' : '#a8a29e' }}
                    >
                      {search ? 'No notes match' : 'Nothing written yet'}
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex', flexWrap: 'nowrap', alignItems: 'flex-start',
                      overflowX: 'auto', overflowY: 'visible',
                      height: '100%', paddingLeft: 48, paddingRight: 80,
                      paddingTop: 52, paddingBottom: 32,
                      scrollbarWidth: 'none',
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {/* Pinned first */}
                      {pinned.map((n, i) => (
                        <NoteGalleryCard
                          key={n.id}
                          note={n}
                          active={activeId === n.id}
                          isOpening={openingId === n.id}
                          onClick={() => handleCardOpen(n.id)}
                          onPin={() => handlePin(n)}
                          onDelete={() => handleDelete(n.id)}
                          index={i}
                        />
                      ))}
                      {/* Divider between pinned and rest */}
                      {pinned.length > 0 && rest.length > 0 && (
                        <div key="divider" style={{ flex: '0 0 32px', height: 268, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, paddingBottom: 8, gap: 4, marginLeft: 10, marginRight: 4 }}>
                          <span style={{
                            fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase',
                            color: ultraMode ? 'rgba(0,255,200,0.22)' : 'rgba(26,25,22,0.22)',
                            fontFamily: ultraMode ? '"Courier New", monospace' : 'Georgia, serif',
                            writingMode: 'vertical-rl', flexShrink: 0,
                          }}>pinned</span>
                          <div style={{ width: 1, flex: 1, background: ultraMode ? 'rgba(0,255,200,0.10)' : 'rgba(26,25,22,0.07)' }} />
                        </div>
                      )}
                      {/* Rest */}
                      {rest.map((n, i) => (
                        <NoteGalleryCard
                          key={n.id}
                          note={n}
                          active={activeId === n.id}
                          isOpening={openingId === n.id}
                          onClick={() => handleCardOpen(n.id)}
                          onPin={() => handlePin(n)}
                          onDelete={() => handleDelete(n.id)}
                          index={pinned.length + (pinned.length > 0 ? 1 : 0) + i}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Setup popup — floats over dimmed gallery */}
            <AnimatePresence>
              {activeId === 'new' && newNoteOpts === null && (
                <NewNoteSetup
                  key="setup"
                  onStart={(opts) => setNewNoteOpts(opts)}
                  onCancel={() => setActiveId(null)}
                />
              )}
            </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
