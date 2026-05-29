'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Step data ────────────────────────────────────────────────────────────────

interface Step {
  title: string
  body: string
  tip?: string
  visual?: string   // short ASCII/text mockup
}

interface GuideEntry {
  id: string
  name: string
  color: string
  monogram: string
  tagline: string
  connectLabel: string
  steps: Step[]
}

const GUIDES: Record<TabId, GuideEntry> = {
  canvas: {
    id: 'canvas',
    name: 'Canvas LMS',
    color: '#e66000',
    monogram: 'C',
    tagline: 'Your assignments become tasks automatically.',
    connectLabel: 'Connect Canvas →',
    steps: [
      {
        title: 'Open Canvas Settings',
        body: 'Log into your university Canvas account (e.g. canvas.youruni.edu). Click your avatar in the top-left corner, then choose Account → Settings.',
        visual: '[ ◉ Profile ] → Account → Settings',
      },
      {
        title: 'Create a new access token',
        body: 'Scroll down to the "Approved Integrations" section. Click "+ New Access Token".',
        visual: '─ Approved Integrations ─────\n  + New Access Token',
      },
      {
        title: 'Name it "Maable"',
        body: 'In the purpose field type "Maable". Leave the Expiry Date blank so it doesn\'t expire. Click "Generate Token".',
        tip: 'Leaving expiry blank means you won\'t need to reconnect each term.',
        visual: 'Purpose: Maable\nExpires: (blank)\n[ Generate Token ]',
      },
      {
        title: 'Copy your token',
        body: 'Canvas shows the token once. Copy it now — it will not be displayed again after you close this dialog.',
        tip: 'If you lose the token, just delete it and generate a new one.',
        visual: '╔══════════════════════╗\n║ 1234~abc~xyz…        ║  ← copy me\n╚══════════════════════╝',
      },
      {
        title: 'Paste into Maable',
        body: 'Click "Connect →" on the Canvas card. Paste your Canvas domain (e.g. canvas.youruni.edu) and the token you just copied, then click Connect.',
        visual: 'Canvas URL:   canvas.youruni.edu\nAccess Token: ●●●●●●●●●●●●●●●\n              [ Connect ]',
      },
    ],
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    color: '#1db954',
    monogram: '♫',
    tagline: 'See your currently-playing track in real time.',
    connectLabel: 'Connect Spotify →',
    steps: [
      {
        title: 'Click Connect on the Spotify card',
        body: 'On the Connect page, find the Spotify card and click "Connect →". You\'ll be redirected to Spotify\'s official authorization page.',
        visual: '┌─ Spotify ────────────────┐\n│  Connect →               │\n└──────────────────────────┘',
      },
      {
        title: 'Sign in to Spotify',
        body: 'Spotify will ask you to sign in if you\'re not already. Use your regular Spotify credentials — Maable never sees your password.',
        visual: 'accounts.spotify.com\n┌─────────────────────────┐\n│ Email / Username        │\n│ ●●●●●●●● (password)     │\n│        [ LOG IN ]       │\n└─────────────────────────┘',
      },
      {
        title: 'Authorize Maable',
        body: 'Spotify shows the permissions Maable is requesting: read your currently-playing track only. Click "Agree".',
        tip: 'Maable only requests read-only access. It cannot control playback or modify your library.',
        visual: 'Maable wants to:\n  ✓ View your currently playing track\n\n[ Cancel ]   [ Agree ]',
      },
      {
        title: 'You\'re connected',
        body: 'Spotify redirects you back to Maable. The Spotify card will show "connected" and your now-playing track will appear on your dashboard.',
        visual: '┌─ Spotify ──── connected ─┐\n│  synced just now         │\n└──────────────────────────┘',
      },
    ],
  },
  'apple-music': {
    id: 'apple-music',
    name: 'Apple Music',
    color: '#fc3c44',
    monogram: '♪',
    tagline: 'Stream what you\'re listening to in real time.',
    connectLabel: 'Connect Apple Music →',
    steps: [
      {
        title: 'Click Connect on the Apple Music card',
        body: 'On the Connect page, find the Apple Music card and click "Connect →". A popup will appear with more details.',
        visual: '┌─ Apple Music ────────────┐\n│  Connect →               │\n└──────────────────────────┘',
      },
      {
        title: 'Click "Connect Apple Music"',
        body: 'Inside the popup, click the red "Connect Apple Music" button. Maable will fetch its developer credentials and open Apple\'s authorization dialog.',
        visual: '╔═ Apple Music ══════════╗\n║                        ║\n║  [ Connect Apple Music ]║\n╚════════════════════════╝',
      },
      {
        title: 'Sign in with your Apple ID',
        body: 'Apple\'s official dialog appears in your browser. Sign in with the Apple ID that has your Apple Music subscription.',
        tip: 'This dialog is served by Apple, not Maable. Your Apple ID is never sent to Maable\'s servers.',
        visual: 'apple.com\n┌─────────────────────────┐\n│ Apple ID                │\n│ ●●●●●●●●                │\n│  [ Sign In ]            │\n└─────────────────────────┘',
      },
      {
        title: 'Allow access',
        body: 'Apple asks if Maable can access your Apple Music library to read playback state. Click "Allow".',
        visual: '"Maable" would like to\naccess your Apple Music.\n\n[ Don\'t Allow ]  [ Allow ]',
      },
      {
        title: 'You\'re connected',
        body: 'The popup closes and the Apple Music card updates. Your now-playing track will show on your dashboard whenever Apple Music is playing.',
        tip: 'Apple Music authorization is session-based and runs in your browser — no music data is stored on Maable servers.',
        visual: '┌─ Apple Music ─ connected ┐\n│  Now playing in-browser  │\n└──────────────────────────┘',
      },
    ],
  },
}

const TABS = ['canvas', 'spotify', 'apple-music'] as const
type TabId = (typeof TABS)[number]

// ─── Component ────────────────────────────────────────────────────────────────

export function SetupGuideModal({
  onClose,
  onConnect,
  initialTab = 'canvas',
}: {
  onClose: () => void
  onConnect: (id: string) => void
  initialTab?: TabId
}) {
  const [tab, setTab]   = useState<TabId>(initialTab)
  const [step, setStep] = useState(0)

  const guide = GUIDES[tab]
  const steps = guide.steps
  const isLast = step === steps.length - 1

  // Reset step when tab changes
  useEffect(() => { setStep(0) }, [tab])

  // Escape to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const currentStep = steps[step] ?? steps[0]!

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(10,9,8,0.60)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 flex flex-col"
        style={{
          width: 'min(94vw, 560px)',
          maxHeight: '90vh',
          backgroundColor: '#fff',
          border: '1px solid rgba(26,25,22,0.10)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.20)',
        }}
        initial={{ scale: 0.94, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 24 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(26,25,22,0.07)' }}>
          <p className="text-base text-stone-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Setup guide
          </p>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-stone-600 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-0 px-7 pt-5 pb-0">
          {TABS.map(id => {
            const g = GUIDES[id]
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-2 px-4 py-2 text-xs transition-all"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  borderBottom: active ? `2px solid ${g.color}` : '2px solid transparent',
                  color: active ? g.color : '#a8a29e',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: active ? g.color : '#d6d3d1', fontSize: 10, fontWeight: 600 }}
                >
                  {g.monogram}
                </span>
                {g.name}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 pt-6 pb-2" style={{ scrollbarWidth: 'none' }}>
          {/* Tagline */}
          <p className="text-xs text-stone-400 mb-6" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {guide.tagline}
          </p>

          {/* Step progress dots */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="transition-all"
                style={{
                  width:  i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === step ? guide.color : i < step ? `${guide.color}55` : 'rgba(26,25,22,0.10)',
                }}
              />
            ))}
            <span className="text-[10px] text-stone-300 ml-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {step + 1} / {steps.length}
            </span>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${step}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {/* Step number + title */}
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] shrink-0 mt-0.5"
                  style={{ backgroundColor: guide.color, fontWeight: 600 }}
                >
                  {step + 1}
                </span>
                <p className="text-sm text-stone-800 leading-snug" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {currentStep.title}
                </p>
              </div>

              {/* Body */}
              <p className="text-sm text-stone-500 leading-relaxed mb-4 pl-9">
                {currentStep.body}
              </p>

              {/* Visual mockup */}
              {currentStep.visual && (
                <div
                  className="pl-9 mb-4"
                >
                  <pre
                    className="text-[11px] text-stone-500 leading-relaxed p-3 rounded-lg overflow-x-auto"
                    style={{
                      fontFamily: '"SF Mono", "Fira Code", monospace',
                      backgroundColor: 'rgba(26,25,22,0.04)',
                      border: '1px solid rgba(26,25,22,0.06)',
                    }}
                  >
                    {currentStep.visual}
                  </pre>
                </div>
              )}

              {/* Tip */}
              {currentStep.tip && (
                <div
                  className="pl-9 mb-2"
                >
                  <p
                    className="text-[11px] leading-relaxed px-3 py-2 rounded-lg"
                    style={{
                      color: guide.color,
                      backgroundColor: `${guide.color}0f`,
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                    }}
                  >
                    {currentStep.tip}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderTop: '1px solid rgba(26,25,22,0.07)' }}
        >
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-xs text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-0"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            {isLast ? (
              <motion.button
                onClick={() => { onClose(); onConnect(guide.id) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs px-5 py-2 text-white rounded-lg"
                style={{ backgroundColor: guide.color, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {guide.connectLabel}
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setStep(s => s + 1)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs px-5 py-2 text-white rounded-lg"
                style={{ backgroundColor: guide.color, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                Next →
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
