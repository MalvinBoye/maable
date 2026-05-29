'use client'

import { motion } from 'framer-motion'
import { updatePassword } from './actions'

const field = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0  },
}

const INPUT_CLASS =
  'w-full bg-transparent outline-none text-base text-stone-900 pb-2 transition-colors placeholder:text-stone-300'
const INPUT_STYLE = { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }
const UNDERLINE_DEFAULT = '1px solid rgba(26,25,22,0.15)'

const ERROR_MESSAGES: Record<string, string> = {
  too_short: 'Password must be at least 8 characters.',
  mismatch:  'Passwords don\'t match.',
  failed:    'Something went wrong. Try requesting a new link.',
}

function PasswordField({ id, name, label, autoComplete }: { id: string; name: string; label: string; autoComplete: string }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2.5">{label}</label>
      <div className="relative cursor-text">
        <input
          id={id}
          name={name}
          type="password"
          autoComplete={autoComplete}
          required
          minLength={8}
          placeholder="••••••••"
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
        <span className="block w-full" style={{ borderBottom: UNDERLINE_DEFAULT, transition: 'border-color 0.18s' }} aria-hidden />
      </div>
    </div>
  )
}

export function UpdateForm({ error }: { error: string | null }) {
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong.') : null

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      <motion.div variants={field} className="mb-10">
        <h1 className="text-3xl text-stone-900 leading-snug" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          New password.
        </h1>
        <p className="text-sm text-stone-400 mt-1.5">Choose something you won&apos;t forget.</p>
      </motion.div>

      <form action={updatePassword} className="space-y-8">
        <motion.div variants={field}>
          <PasswordField id="password" name="password" label="New password" autoComplete="new-password" />
        </motion.div>

        <motion.div variants={field}>
          <PasswordField id="confirm" name="confirm" label="Confirm password" autoComplete="new-password" />
        </motion.div>

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

        <motion.div variants={field}>
          <button
            type="submit"
            className="w-full py-3.5 text-sm text-white transition-colors"
            style={{ backgroundColor: '#1a1916', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#44403c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a1916')}
          >
            Set password
          </button>
        </motion.div>
      </form>
    </motion.div>
  )
}
