'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Tutorial steps ───────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Welcome to Maable.',
    icon: '/illustrations/chibi-happy.png',
    body: [
      'Maable turns your daily work into a game. Complete tasks, build habits, write notes, and earn XP as you go.',
      'Every section feeds into a single progression system — tasks, habits, notes, streaks, and daily logins all earn you points.',
      'Use the navigation bar at the top to move between sections. This guide walks through every part of the app.',
    ],
    tip: 'Start by completing your profile — add a display name, bio, and photo. Then create your first task.',
  },
  {
    title: 'Your dashboard.',
    icon: '/illustrations/scene-desk.jpeg',
    body: [
      'The dashboard is your home base. It shows your current XP, level, streak, tasks due, and habit rings.',
      'There are three dashboard layouts. Switch between them in Settings → Appearance, or use the floating pill button in the bottom-right corner of any dashboard.',
      'Classic (Type 1) shows your stats grid and upcoming tasks in a clean overview. Mission Desk (Type 2) is interactive — check off tasks and habits directly without navigating away. Dark RPG (Type 3) gives everything a dark fantasy aesthetic with gold accents and your character portrait.',
    ],
    tip: 'Try the Mission Desk layout for your daily workflow — you can add tasks and tick habits without leaving the dashboard.',
  },
  {
    title: 'Tasks.',
    icon: '/illustrations/icon-calendar.png',
    body: [
      'Tasks are the core of Maable. Create one with a title, priority level, due date, and category. Higher priority tasks earn more XP when completed.',
      'Mark a task done to earn XP instantly. Completed tasks disappear from the active list and count toward your profile stats.',
      'Use the category filter at the top of the Tasks page to focus on one area — Career, Student, Hobbies, or Reading.',
      'You can also create tasks from the dashboard using the Quick Add field (Mission Desk layout).',
    ],
    xpTable: [
      { label: 'Complete an urgent task', xp: 75 },
      { label: 'Complete a high-priority task', xp: 50 },
      { label: 'Complete a medium task', xp: 25 },
      { label: 'Complete a low-priority task', xp: 10 },
    ],
    tip: 'Set realistic due dates. Tasks shown on the dashboard are ordered by due date, so the most pressing ones surface automatically.',
  },
  {
    title: 'Habits & streaks.',
    icon: '/illustrations/chibi-calm.png',
    body: [
      'Habits are recurring actions you want to make automatic — exercise, reading, journaling, water intake.',
      'Create a habit with a name, frequency (daily, weekly, or custom days), and an optional target count per session.',
      'Tap the circle on a habit to log a completion. A filled ring means done for today. Miss a day on a daily habit and the streak resets to zero.',
      'Streaks compound over time. A 7-day streak earns a bonus. A 30-day streak earns a big bonus. Consistency is how you level up fast.',
    ],
    xpTable: [
      { label: 'Log a habit completion', xp: 20 },
      { label: '7-day streak bonus', xp: 50 },
      { label: '30-day streak bonus', xp: 200 },
    ],
    tip: 'Log habits at the same time each day — pair them with an existing routine (morning coffee, before bed) so they become automatic.',
  },
  {
    title: 'Notes & Revision Mode.',
    icon: '/illustrations/scene-books.jpeg',
    body: [
      'Notes are long-form entries for any subject. Write lecture notes, project plans, book summaries, or ideas.',
      'Organise notes under a subject or tag. The notes list shows previews so you can find what you need quickly.',
      'Revision Mode turns your notes into flashcards automatically. Open a note, then tap "Revise" to enter a full-screen Q&A session.',
      'Cards use spaced repetition — rate each card Easy, Hard, or Missed. Missed cards come back sooner. This is how you actually retain information.',
      'You can also ask Chibi (the AI companion) to generate flashcards from your notes: say "Help me revise [subject]".',
    ],
    xpTable: [
      { label: 'Create a note', xp: 5 },
      { label: 'Complete a revision session', xp: 15 },
    ],
    tip: 'Write notes as if explaining to someone else — full sentences, clear headings. Chibi reads the structure to generate better flashcards.',
  },
  {
    title: 'Categories.',
    icon: '/illustrations/category-career.png',
    body: [
      'Categories divide your life into dedicated spaces: Career, Student, Hobbies, and Reading.',
      'Each category has its own task list, quick links, and resource section. Navigate there via the top nav or tap a category card on the dashboard.',
      'Career tracks job-related work and goals. Student handles coursework and assignments. Hobbies is a space for personal projects. Reading tracks books and articles.',
      'You can tag tasks and notes to a category when creating them, and filter to see only that area.',
    ],
    tip: 'Use the Reading category with the Chibi AI — say "Summarise my notes on [book]" and it can pull from your notes to create a brief.',
  },
  {
    title: 'Moodboard.',
    icon: '/illustrations/scene-monstera.jpeg',
    body: [
      'The Moodboard is a visual inspiration space — a scrollable collage of images that keeps your motivation visible.',
      'Upload any image by tapping the + button. You\'ll be prompted to crop and frame the image before it\'s saved.',
      'Add an optional caption to each pin. Hover or long-press a pin to see the caption and a delete button.',
      'Your moodboard is personal — it isn\'t shared publicly. Think of it as a digital vision board.',
    ],
    tip: 'Pin screenshots of goals, aesthetic references, quotes, or anything that keeps you in the right headspace.',
  },
  {
    title: 'Your profile.',
    icon: '/illustrations/avatar-user.png',
    body: [
      'Your profile page is your character sheet. It shows your level, XP bar, class title, streak, achievements, XP history, and mood board pins.',
      'Tap the camera icon on your avatar to upload a profile photo. It will be used across the dashboard and all layouts.',
      'Your class title changes as you level up: Novice → Apprentice → Scholar → Sage → Expert → Master → Legend.',
      'Achievements unlock automatically when you hit milestones (first task, 7-day streak, level 10, etc.).',
      'The XP history feed shows every recent point-earning action so you can see exactly what\'s contributing to your progression.',
    ],
    tip: 'Edit your display name, username, and bio from the profile page. Your username is how friends can find you on the leaderboard.',
  },
  {
    title: 'Settings & appearance.',
    icon: '/illustrations/chibi-grumpy.png',
    body: [
      'Settings lets you control how the app looks and behaves.',
      'Appearance → Dashboard Layout lets you switch between Classic, Mission Desk, and Dark RPG. Your choice is saved and persists across sessions.',
      'You can also switch layouts directly from any dashboard using the compact pill button in the bottom-right corner — hover it to expand and click a layout number.',
      'Future settings will include notification preferences, integration connections (Canvas, LinkedIn), and theme options.',
    ],
    tip: 'Try each dashboard layout for a week before settling — some users prefer Classic for planning, Mission Desk for execution days.',
  },
  {
    title: 'Chibi — your AI companion.',
    icon: '/illustrations/chibi-alert.png',
    body: [
      'Chibi is the character in the bottom-right corner. Tap it to open a chat window and ask anything about your data.',
      'Chibi can read your tasks, habits, notes, and stats — and respond with context-aware help.',
      'Things you can say: "What\'s due today?", "Help me revise for biology", "Show my urgent tasks", "What\'s my streak?", "I need motivation", "Summarise my notes on [topic]".',
      'Chibi also has a playful personality — it reacts differently depending on your current streak, XP, and time of day.',
    ],
    tip: 'For best results with note revision, structure your notes with clear headings and bullet points before asking Chibi to generate flashcards.',
  },
  {
    title: 'Schedule.',
    icon: '/illustrations/icon-timer.png',
    body: [
      'Schedule is your intelligent day planner. It takes your tasks and habits and auto-arranges them into time blocks so you don\'t have to think about what to do next.',
      'Simply open Schedule and it will draft a plan for today based on task priorities, due dates, habit timings, and your available hours.',
      'You can drag and reorder time blocks to fit your real day, and mark items done directly from the schedule.',
      'This feature is currently being built. Check back soon for the full experience.',
    ],
    tip: 'Schedule is designed to cut the "what should I do next?" decision loop — your only job will be to follow the plan and earn XP.',
  },
  {
    title: 'Leaderboard & friends.',
    icon: '/illustrations/icon-eh.png',
    body: [
      'The Leaderboard ranks users by XP. See how your level and total points compare to others.',
      'The Playground section lets you connect with friends — search by username, send requests, and see their profiles.',
      'A mutual follow means you both appear in each other\'s friend activity feeds.',
      'Friendly competition is the fastest motivator — seeing a friend at level 12 when you\'re at level 8 is a powerful nudge.',
    ],
    tip: 'Your total XP is permanent — it never resets. Leaderboard position reflects total lifetime effort, not just recent activity.',
  },
  {
    title: 'How XP & levels work.',
    icon: '/illustrations/icon-angel.png',
    body: [
      'Every 1,000 XP = 1 level. There is no cap — keep going.',
      'XP is earned for almost every action in the app. The more consistently you use Maable, the faster you level up.',
      'Your level unlocks your class title and affects how you appear on the leaderboard. Higher levels unlock achievements.',
      'XP is never taken away — even if a streak breaks or a habit is missed, your existing points remain.',
    ],
    xpTable: [
      { label: 'Complete urgent task', xp: 75 },
      { label: 'Complete high task', xp: 50 },
      { label: 'Complete medium task', xp: 25 },
      { label: 'Complete low task', xp: 10 },
      { label: 'Log a habit', xp: 20 },
      { label: 'Create a note', xp: 5 },
      { label: 'Complete a revision session', xp: 15 },
      { label: '7-day streak bonus', xp: 50 },
      { label: '30-day streak bonus', xp: 200 },
      { label: 'Daily login', xp: 5 },
    ],
    tip: 'The biggest XP gains come from streaks compounding over time. Logging even one habit every day beats sporadic high-output days.',
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
              width: 400,
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
              <div>
                <p className="text-xs text-stone-400 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                  App Guide
                </p>
                <p className="text-xs text-stone-300 mt-0.5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {step + 1} of {STEPS.length}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-300 hover:text-stone-700 transition-colors text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-1 px-7 py-3 shrink-0 flex-wrap">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="transition-all"
                  style={{
                    width: i === step ? 18 : 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: i === step ? '#1a1916' : i < step ? 'rgba(26,25,22,0.30)' : 'rgba(26,25,22,0.12)',
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
                    className="w-28 h-28 object-contain mx-auto my-6 rounded-lg"
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
                  <div className="space-y-3 mb-5">
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
                      className="rounded-lg overflow-hidden mb-5"
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
                            className="text-xs font-medium"
                            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1a1916' }}
                          >
                            +{row.xp}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tip */}
                  {'tip' in current && current.tip && (
                    <div
                      className="rounded-lg px-4 py-3"
                      style={{ backgroundColor: 'rgba(26,25,22,0.03)', border: '1px solid rgba(26,25,22,0.07)' }}
                    >
                      <p className="text-xs text-stone-400 tracking-widest uppercase mb-1">Tip</p>
                      <p className="text-xs text-stone-500 leading-relaxed" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                        {current.tip}
                      </p>
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

              <div className="flex gap-1">
                {[0, Math.floor(STEPS.length / 3), Math.floor(STEPS.length * 2 / 3)].map((jumpTo, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(jumpTo)}
                    className="text-xs text-stone-300 hover:text-stone-600 transition-colors px-1"
                    style={{ fontFamily: 'Georgia, serif' }}
                    title={['Start', 'Middle', 'End'][i]}
                  >
                    {['·', '·', '·'][i]}
                  </button>
                ))}
              </div>

              {isLast ? (
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm text-white px-4 py-2 rounded"
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
