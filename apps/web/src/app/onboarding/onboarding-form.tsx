'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { completeOnboarding } from './actions'
import { AVATAR_OPTIONS } from '@/lib/avatars'

const INPUT_CLASS =
  'w-full bg-transparent outline-none text-lg text-stone-900 pb-2 transition-colors placeholder:text-stone-300'
const INPUT_STYLE = { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }
const UNDERLINE_DEFAULT = '1px solid rgba(26,25,22,0.15)'

const ERROR_MESSAGES: Record<string, string> = {
  name_too_short: 'Name must be at least 2 characters.',
  name_too_long:  'Name must be 40 characters or fewer.',
  failed:         'Something went wrong — try again.',
}

export function OnboardingForm({ defaultName, error }: { defaultName: string; error: string | null }) {
  const [selected, setSelected] = useState<string | null>(null)
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong.') : null

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: '#faf9f7' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] space-y-10"
      >
        {/* Wordmark */}
        <p
          className="text-2xl text-stone-800 select-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Maable
        </p>

        {/* Heading */}
        <div>
          <p
            className="text-3xl text-stone-900 mb-2 leading-snug"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Welcome.
          </p>
          <p className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Let&apos;s get you set up. Takes thirty seconds.
          </p>
        </div>

        <form action={completeOnboarding} className="space-y-10">
          <input type="hidden" name="avatar_url" value={selected ?? ''} />

          {/* Name */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2.5">
              What should we call you?
            </label>
            <div className="relative cursor-text">
              <input
                name="display_name"
                type="text"
                autoComplete="given-name"
                required
                defaultValue={defaultName}
                placeholder="Your name"
                maxLength={40}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={(e) => {
                  const span = e.currentTarget.nextElementSibling as HTMLElement
                  if (span) span.style.borderBottomColor = '#1a1916'
                }}
                onBlur={(e) => {
                  const span = e.currentTarget.nextElementSibling as HTMLElement
                  if (span) span.style.borderBottomColor = 'rgba(26,25,22,0.15)'
                }}
              />
              <span
                className="block w-full"
                style={{ borderBottom: UNDERLINE_DEFAULT, transition: 'border-color 0.18s' }}
                aria-hidden
              />
            </div>
          </div>

          {/* Avatar picker — hand-drawn illustrations */}
          <div>
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">
              Pick your character{' '}
              <span className="normal-case tracking-normal text-stone-300">(optional)</span>
            </p>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelected(selected === av.id ? null : av.id)}
                  title={av.label}
                  className="flex flex-col items-center gap-1"
                >
                  <motion.div
                    animate={{
                      scale:   selected === av.id ? 1.08 : 1,
                      opacity: selected !== null && selected !== av.id ? 0.35 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(26,25,22,0.04)',
                      border: selected === av.id
                        ? '2px solid #1a1916'
                        : '2px solid transparent',
                      padding: 4,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={av.src}
                      alt={av.label}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </motion.div>
                  <span className="text-[10px] text-stone-400">{av.label}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {errorMsg}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 text-sm text-white transition-colors"
            style={{ backgroundColor: '#1a1916', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#44403c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a1916')}
          >
            Let&apos;s go
          </button>
        </form>
      </motion.div>
    </div>
  )
}
