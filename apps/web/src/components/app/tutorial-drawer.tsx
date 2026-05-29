'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Tutorial steps ───────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Welcome to Maable.',
    icon: '/illustrations/chibi-happy.png',
    body: [
      'Maable is your personal productivity companion — tasks, habits, notes, and XP all in one place.',
      'The more you do, the more you level up. Everything you complete earns XP.',
      'Use the nav at the top to jump between sections. Chibi (bottom right) is always there to help.',
    ],
  },
  {
    title: 'Tasks & XP.',
    icon: '/illustrations/icon-calendar.png',
    body: [
      'Create tasks with a priority level. Higher priority = more XP when you mark them done.',
      '• Urgent: 75 XP  • High: 50 XP  • Medium: 25 XP  • Low: 10 XP',
      'Use categories (Career, Student, Hobbies) to keep tasks organised by area of your life.',
    ],
    xpTable: [
      { label: 'Complete an urgent task', xp: 75 },
      { label: 'Complete a high-priority task', xp: 50 },
      { label: 'Complete a medium task', xp: 25 },
      { label: 'Complete a low-priority task', xp: 10 },
    ],
  },
  {
    title: 'Habits & streaks.',
    icon: '/illustrations/chibi-calm.png',
    body: [
      'Add habits you want to build — daily, weekly, or custom schedules.',
      'Log a habit each day and your streak grows. Miss a day and it resets.',
      'Long streaks earn bonus XP. Consistency is how you win.',
    ],
    xpTable: [
      { label: 'Log a habit completion', xp: 20 },
      { label: '7-day streak bonus', xp: 50 },
      { label: '30-day streak bonus', xp: 200 },
    ],
  },
  {
    title: 'Notes & Revision Mode.',
    icon: '/illustrations/scene-books.jpeg',
    body: [
      'Write notes on any subject. Use headings, bullet points, and definitions — Chibi can read them.',
      'Ask Chibi "Help me revise for maths" and it turns your notes into flashcards automatically.',
      'Flashcards use spaced repetition: Easy, Hard, Missed — reviewed intelligently.',
    ],
    xpTable: [
      { label: 'Create a note', xp: 5 },
    ],
  },
  {
    title: 'Categories.',
    icon: '/illustrations/category-career.png',
    body: [
      'Career, Student, Hobbies, and Reading are dedicated spaces for different parts of your life.',
      'Each category tracks its own tasks, has quick links, and shows your XP progress.',
      'Connect integrations (Canvas, LinkedIn) to auto-import tasks and save time.',
    ],
  },
  {
    title: 'Chibi — your AI companion.',
    icon: '/illustrations/chibi-alert.png',
    body: [
      'Tap the character in the bottom right to talk to Chibi.',
      'Chibi runs entirely on-device — no subscription, no external API calls.',
      'Things you can say: "What\'s due today?", "Open my biology notes", "Help me revise for physics", "Show urgent tasks", "I need motivation".',
    ],
  },
  {
    title: 'How XP & levels work.',
    icon: '/illustrations/icon-angel.png',
    body: [
      'Every action earns XP. Every 1,000 XP = 1 level. There\'s no cap.',
      'Your level shows on the leaderboard — compete with friends or just beat your own score.',
      'XP is permanent. Completing a task, logging a habit, creating a note — it all counts.',
    ],
    xpTable: [
      { label: 'Complete urgent task', xp: 75 },
      { label: 'Complete high task', xp: 50 },
      { label: 'Complete medium task', xp: 25 },
      { label: 'Complete low task', xp: 10 },
      { label: 'Log a habit', xp: 20 },
      { label: 'Create a note', xp: 5 },
      { label: '7-day streak', xp: 50 },
      { label: '30-day streak', xp: 200 },
    ],
  },
]

// ─── TutorialDrawer ───────────────────────────────────────────────────────────

export function TutorialDrawer() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  const current = STEPS[step]!
  const isLast = step === STEPS.length - 1

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setStep(0) }}
        aria-label="Open tutorial"
        className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors text-sm leading-none"
        style={{ border: '1px solid rgba(26,25,22,0.12)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
      >
        ?
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
            style={{
              width: 380,
              backgroundColor: '#faf9f7',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
              borderLeft: '1px solid rgba(26,25,22,0.08)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-7 py-5 shrink-0"
              style={{ borderBottom: '1px solid rgba(26,25,22,0.07)' }}
            >
              <p
                className="text-sm text-stone-400 tracking-widest uppercase"
              >
                Guide
              </p>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-300 hover:text-stone-700 transition-colors text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-1.5 px-7 py-4 shrink-0">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="transition-all"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === step ? '#1a1916' : 'rgba(26,25,22,0.15)',
                  }}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-7 pb-8" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                >
                  {/* Illustration */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.icon}
                    alt=""
                    className="w-28 h-28 object-contain mx-auto my-6"
                    draggable={false}
                  />

                  {/* Title */}
                  <h2
                    className="text-2xl text-stone-900 mb-5 leading-snug"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    {current.title}
                  </h2>

                  {/* Body */}
                  <div className="space-y-3 mb-6">
                    {current.body.map((line, i) => (
                      <p
                        key={i}
                        className="text-sm text-stone-600 leading-relaxed"
                        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* XP table */}
                  {'xpTable' in current && current.xpTable && (
                    <div
                      className="rounded-lg overflow-hidden"
                      style={{ border: '1px solid rgba(26,25,22,0.08)' }}
                    >
                      <div
                        className="px-4 py-2"
                        style={{ backgroundColor: 'rgba(26,25,22,0.04)', borderBottom: '1px solid rgba(26,25,22,0.06)' }}
                      >
                        <p className="text-xs tracking-widest uppercase text-stone-400">XP earned</p>
                      </div>
                      {current.xpTable.map((row, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-2.5"
                          style={{ borderBottom: i < (current.xpTable?.length ?? 0) - 1 ? '1px solid rgba(26,25,22,0.05)' : 'none' }}
                        >
                          <p className="text-xs text-stone-500" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                            {row.label}
                          </p>
                          <span
                            className="text-xs text-stone-800 font-medium"
                            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                          >
                            +{row.xp}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div
              className="px-7 py-5 flex items-center justify-between shrink-0"
              style={{ borderTop: '1px solid rgba(26,25,22,0.07)' }}
            >
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="text-sm text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                ← Back
              </button>

              <p className="text-xs text-stone-300">
                {step + 1} / {STEPS.length}
              </p>

              {isLast ? (
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm text-white px-4 py-2"
                  style={{ backgroundColor: '#1a1916', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  className="text-sm text-stone-700 hover:text-stone-900 transition-colors"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Next →
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
