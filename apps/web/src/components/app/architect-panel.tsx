'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useArchitect, type DashSection } from '@/lib/architect-context'

// ─── Tutorial steps ────────────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Architect Mode',
    body: 'You can now redesign your dashboard. Drag sections to reorder them, hide ones you don\'t use, and make the app truly yours.',
    icon: '⊞',
  },
  {
    title: 'Drag to reorder',
    body: 'Each section on the dashboard has a drag handle (≡) on the left. Click and drag it up or down to change the order.',
    icon: '↕',
  },
  {
    title: 'Hide sections',
    body: 'Click the eye icon (◉) next to any section to hide it. You can bring it back any time from this panel.',
    icon: '◉',
  },
  {
    title: 'Your layout is saved',
    body: 'Everything is saved automatically to your device. Your dashboard will look exactly the same next time you open Maable.',
    icon: '◈',
  },
  {
    title: 'You\'re all set',
    body: 'Click the ⊞ icon in the nav menu again to exit Architect Mode. Explore freely — nothing breaks.',
    icon: '✦',
  },
]

// ─── Architect tutorial overlay ────────────────────────────────────────────────

function ArchitectTutorial() {
  const { tutorialStep, nextTutorialStep, skipTutorial } = useArchitect()
  if (tutorialStep === null) return null

  const step = TUTORIAL_STEPS[tutorialStep]!
  const isLast = tutorialStep === TUTORIAL_STEPS.length - 1

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-backdrop"
        className="fixed inset-0 z-[200]"
        style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={skipTutorial}
      />
      <motion.div
        key="tutorial-card"
        className="fixed z-[201] flex flex-col"
        style={{
          bottom: '5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(92vw, 420px)',
          backgroundColor: '#0d0c0a',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: '28px 28px 22px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Step icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
        >
          {step.icon}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tutorialStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
          >
            <p
              className="text-lg text-white mb-2 leading-tight"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {step.title}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Step dots + actions */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === tutorialStep ? 18 : 6,
                  height: 6,
                  backgroundColor: i === tutorialStep ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.14)',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={skipTutorial}
              className="text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              skip
            </button>
            <motion.button
              onClick={nextTutorialStep}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2 rounded-full text-sm text-white transition-all"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {isLast ? 'done' : 'next →'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Section drag item ─────────────────────────────────────────────────────────

const SECTION_LABELS: Record<DashSection, string> = {
  'stats': 'Stats & Level',
  'life-areas': 'Life Areas',
  'playground': 'Playground',
}

function SectionRow({
  id,
  index,
  total,
  hidden,
  onMove,
  onToggle,
}: {
  id: DashSection
  index: number
  total: number
  hidden: boolean
  onMove: (from: number, to: number) => void
  onToggle: (id: DashSection) => void
}) {
  const [dragging] = useState(false)

  return (
    <motion.div
      layout
      className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all select-none"
      style={{
        backgroundColor: dragging ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${dragging ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`,
        opacity: hidden ? 0.35 : 1,
      }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.055)' }}
    >
      {/* Drag handle */}
      <span
        className="text-white/30 cursor-grab active:cursor-grabbing select-none"
        style={{ fontSize: 16, letterSpacing: 1 }}
        title="Drag to reorder"
      >
        ≡
      </span>

      {/* Label */}
      <p
        className="flex-1 text-sm"
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.65)',
        }}
      >
        {SECTION_LABELS[id]}
      </p>

      {/* Move buttons */}
      <div className="flex gap-1">
        <button
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          className="w-6 h-6 flex items-center justify-center rounded text-xs transition-all disabled:opacity-20"
          style={{ color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          ↑
        </button>
        <button
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
          className="w-6 h-6 flex items-center justify-center rounded text-xs transition-all disabled:opacity-20"
          style={{ color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          ↓
        </button>
      </div>

      {/* Toggle visibility */}
      <button
        onClick={() => onToggle(id)}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-sm"
        style={{
          backgroundColor: hidden ? 'rgba(255,100,100,0.15)' : 'rgba(255,255,255,0.06)',
          color: hidden ? '#ff6b6b' : 'rgba(255,255,255,0.45)',
        }}
        title={hidden ? 'Show section' : 'Hide section'}
      >
        {hidden ? '◎' : '◉'}
      </button>
    </motion.div>
  )
}

// ─── Architect floating panel ─────────────────────────────────────────────────

export function ArchitectPanel() {
  const {
    architectMode, toggleArchitect,
    sectionOrder, hiddenSections,
    moveSection, toggleSection,
    tutorialStep, startTutorial,
  } = useArchitect()

  return (
    <>
      <AnimatePresence>
        {architectMode && (
          <>
            {/* Dashed outline on viewport edge */}
            <motion.div
              className="fixed inset-0 pointer-events-none z-[150]"
              style={{
                border: '2px dashed rgba(99, 102, 241, 0.35)',
                margin: 4,
                borderRadius: 12,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Architect panel */}
            <motion.div
              className="fixed z-[160] flex flex-col"
              style={{
                right: 16,
                top: '5rem',
                width: 260,
                backgroundColor: '#0d0c0a',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 18,
                padding: '18px 16px 14px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
              initial={{ opacity: 0, x: 40, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p
                    className="text-sm text-white leading-none"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    Architect Mode
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    redesign your dashboard
                  </p>
                </div>
                <button
                  onClick={toggleArchitect}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.40)' }}
                  title="Exit architect mode"
                >
                  ✕
                </button>
              </div>

              {/* Section list */}
              <p
                className="text-[10px] tracking-widest uppercase mb-2"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                sections
              </p>
              <div className="flex flex-col gap-1.5 mb-4">
                {sectionOrder.map((id, i) => (
                  <SectionRow
                    key={id}
                    id={id}
                    index={i}
                    total={sectionOrder.length}
                    hidden={hiddenSections.has(id)}
                    onMove={moveSection}
                    onToggle={toggleSection}
                  />
                ))}
              </div>

              <div className="h-px mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

              {/* Reset + tutorial */}
              <div className="flex items-center justify-between">
                <button
                  onClick={startTutorial}
                  className="text-xs transition-colors"
                  style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.60)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
                >
                  ? tutorial
                </button>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.16)', fontFamily: 'Georgia, serif' }}>
                  {tutorialStep !== null ? `step ${tutorialStep + 1}/${TUTORIAL_STEPS.length}` : 'auto-saved'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tutorial overlay (renders outside architect check so it can appear even when panel is animating) */}
      <ArchitectTutorial />
    </>
  )
}
