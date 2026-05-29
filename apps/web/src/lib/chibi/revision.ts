import type { RevisionCard } from './types'

// ─── Build revision cards from raw note text ──────────────────────────────────
//
// Patterns (no LLM — pure text parsing):
//  1. ## Heading / ALL CAPS / Title Case  → section boundary
//  2. Line ending with :                  → subsection boundary
//  3. **Bold term**: context              → definition card
//  4. Term: definition (colon)            → definition card
//  5. Term - definition (dash)            → definition card (from user's algo)
//  6. X is/are (a/an/the) Y              → definition card (from user's algo)
//  7. A vs/versus B                       → comparison card (from user's algo)
//  8. X because Y                         → cause-and-effect card (from user's algo)
//  9. Bullet/numbered list               → "key points" grouped card
// 10. Explicit Q&A (? line + answer)     → direct card
// 11. Long sentences                     → summarise card

export function buildRevisionCards(contentText: string, subject: string): RevisionCard[] {
  const seen = new Set<string>()
  const cards: RevisionCard[] = []

  const clean = (s: string) =>
    s.replace(/\*\*/g, '').replace(/[_*~`#]/g, '').replace(/\s+/g, ' ').trim()

  const push = (prompt: string, answer: string) => {
    const cp = clean(prompt); const ca = clean(answer)
    if (cp.length < 8 || ca.length < 4) return
    const key = cp.toLowerCase().slice(0, 50)
    if (seen.has(key)) return
    seen.add(key)
    cards.push({ prompt: cp, answer: ca })
  }

  // ── Context tracking ──────────────────────────────────────────────────────
  let section = subject || 'General'
  let subsection: string | null = null
  const bulletBuffer: string[] = []
  const ctx = () => subsection ?? section

  const flushBullets = () => {
    if (bulletBuffer.length >= 2) {
      push(
        `What are the key points of "${ctx()}"?`,
        bulletBuffer.map(b => `• ${b}`).join('\n')
      )
    }
    bulletBuffer.length = 0
  }

  const isHeading = (text: string) => {
    if (/^#{1,6}\s/.test(text)) return true
    if (/^[A-Z][A-Z\s&]{2,}$/.test(text) && text.length < 60) return true
    const words = text.split(' ')
    return words.length >= 2 && words.length <= 7
      && words.every(w => /^[A-Z]/.test(w))
      && !/[.,;!?]$/.test(text)
  }

  // ── Line-by-line pass ─────────────────────────────────────────────────────
  for (const rawLine of contentText.split('\n')) {
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

    // Subsection: short line ending with colon
    if (text.endsWith(':') && text.length < 80 && !text.includes(' - ') && text.split(' ').length <= 8) {
      flushBullets()
      subsection = text.slice(0, -1).trim()
      continue
    }

    // **Bold term**: inline definition
    const boldInline = text.match(/^\*\*([^*]{3,55})\*\*[:\s–\-]+(.{15,220})$/)
    if (boldInline) { push(`What is "${boldInline[1]!.trim()}"?`, boldInline[2]!.trim()); continue }

    // Term: definition (colon)
    const colonDef = text.match(/^[-*•]?\s*([A-Za-z][^:]{2,45}):\s+(.{15,220})$/)
    if (colonDef && !colonDef[1]!.trim().startsWith('#')) {
      push(`What is ${colonDef[1]!.trim()}?`, colonDef[2]!.trim()); continue
    }

    // Term - definition (dash)
    const dashDef = text.match(/^([^–\-]{3,45})\s+[-–]\s+(.{10,200})$/)
    if (dashDef && !/^[-•*]/.test(rawLine.trimStart())) {
      push(`What is ${dashDef[1]!.trim()}?`, dashDef[2]!.trim()); continue
    }

    // X is/are (a/an/the) Y — avoid false positives on pronouns
    const isA = text.match(/^([A-Z][a-zA-Z\s]{2,35}?)\s+(?:is|are)\s+(?:a |an |the )?([^.]{15,160})[.]?$/)
    if (isA && !text.endsWith('?') && text.split(' ').length < 22
      && !isA[1]!.toLowerCase().startsWith('this')
      && !isA[1]!.toLowerCase().startsWith('it')) {
      push(`What is ${isA[1]!.trim()}?`, `${isA[1]!.trim()} is ${isA[2]!.trim()}.`); continue
    }

    // A vs B — comparison
    const vsMatch = text.match(/^(.{4,60}?)\s+(?:vs\.?|versus)\s+(.{4,60})$/i)
    if (vsMatch) {
      const [a, b] = [vsMatch[1]!.trim(), vsMatch[2]!.trim()]
      push(
        `What is the difference between ${a} and ${b}?`,
        `Review the distinctions between ${a} and ${b} in your ${section} notes.`
      ); continue
    }

    // X because Y — cause & effect
    const becauseMatch = text.match(/^(.{8,120}?)\s+because\s+(.{8,200})$/i)
    if (becauseMatch) {
      const effect = becauseMatch[1]!.trim()
      const cause = becauseMatch[2]!.trim()
      push(
        `Why ${effect.charAt(0).toLowerCase() + effect.slice(1)}?`,
        `Because ${cause}`
      ); continue
    }

    // Advantages/Disadvantages header → subsection
    if (/^(advantages?|disadvantages?|pros?|cons?|benefits?|drawbacks?)/i.test(text) && text.split(' ').length < 8) {
      flushBullets()
      subsection = text
      continue
    }

    // Bullet / numbered list → buffer
    if (/^[-•*+]\s/.test(rawLine.trimStart()) || /^\d+[.)]\s/.test(text)) {
      bulletBuffer.push(text.replace(/^[-•*+\d.)\s]+/, '').trim())
      continue
    }

    // Long standalone sentence → summarise card
    if (text.length > 80 && text.length < 400) {
      const preview = text.split(' ').slice(0, 6).join(' ')
      push(`Summarise: "${preview}..."`, text)
    }
  }

  flushBullets()

  // ── Post-pass: **bold** terms anywhere in body ────────────────────────────
  const boldRe = /\*\*([^*]{3,55})\*\*/g
  let bm: RegExpExecArray | null
  while ((bm = boldRe.exec(contentText)) !== null) {
    const term = bm[1]!
    const after = contentText.substring(bm.index + bm[0].length, bm.index + bm[0].length + 260)
    const sentence = clean(after.split(/[.!?\n]/)[0] ?? '')
    if (sentence.length > 15) push(`What is "${term}"?`, sentence + '.')
  }

  // ── Post-pass: explicit Q&A lines ────────────────────────────────────────
  const cleanLines = contentText.split('\n').map(l => clean(l)).filter(Boolean)
  for (let i = 0; i < cleanLines.length - 1; i++) {
    const line = cleanLines[i]!
    if (line.endsWith('?') && line.length > 10 && line.length < 160) {
      const next = cleanLines[i + 1]!
      if (!next.endsWith('?') && next.length > 5) { push(line, next); i++ }
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (cards.length === 0) {
    const summary = contentText.slice(0, 500).trim()
    if (summary) push(`What do you know about ${subject}?`, summary)
  }

  return cards.slice(0, 25)
}
