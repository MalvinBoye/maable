'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { signup } from './actions'

const field = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0  },
}

const INPUT_CLASS =
  'w-full bg-transparent outline-none text-base text-stone-900 pb-2 transition-colors placeholder:text-stone-300'
const INPUT_STYLE = { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }
const UNDERLINE_DEFAULT = '1px solid rgba(26,25,22,0.15)'

function Field({
  id, label, type, name, autoComplete, placeholder, hint,
  minLength, maxLength, pattern,
}: {
  id: string; label: string; type: string; name: string
  autoComplete: string; placeholder: string; hint?: string
  minLength?: number; maxLength?: number; pattern?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs tracking-widest uppercase text-stone-400 mb-2.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
          placeholder={placeholder}
          className={INPUT_CLASS}
          style={INPUT_STYLE}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          onFocus={(e)  => {
            const span = e.currentTarget.nextElementSibling as HTMLElement
            if (span) span.style.borderBottomColor = '#1a1916'
          }}
          onBlur={(e)   => {
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
      {hint && <p className="text-xs text-stone-300 mt-1.5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{hint}</p>}
    </div>
  )
}

export function SignupForm({ error }: { error: string | null }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Heading */}
      <motion.div variants={field} className="mb-10">
        <h1
          className="text-3xl text-stone-900 leading-snug"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Start your journey.
        </h1>
        <p className="text-sm text-stone-400 mt-1.5">Create your account — it&apos;s free.</p>
      </motion.div>

      <form action={signup} className="space-y-7">
        <motion.div variants={field}>
          <Field
            id="username" label="Username" type="text"
            name="username" autoComplete="username"
            placeholder="your_username"
            hint="3–20 chars · letters, numbers, underscores"
            minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+"
          />
        </motion.div>

        <motion.div variants={field}>
          <Field
            id="email" label="Email" type="email"
            name="email" autoComplete="email" placeholder="you@example.com"
          />
        </motion.div>

        <motion.div variants={field}>
          <Field
            id="password" label="Password" type="password"
            name="password" autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Min 8 characters"
            minLength={8}
          />
        </motion.div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {error}
          </motion.p>
        )}

        <motion.div variants={field}>
          {/* Terms */}
          <p className="text-xs text-stone-300 mb-5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            By signing up you agree to our{' '}
            <Link href="/terms" className="text-stone-500 hover:text-stone-800 transition-colors underline underline-offset-2">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-stone-500 hover:text-stone-800 transition-colors underline underline-offset-2">Privacy Policy</Link>.
          </p>

          <button
            type="submit"
            className="w-full py-3.5 text-sm text-white transition-colors"
            style={{
              backgroundColor: '#1a1916',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#44403c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a1916')}
          >
            Create account
          </button>
        </motion.div>
      </form>

      {/* Switch */}
      <motion.p variants={field} className="mt-8 text-center text-sm text-stone-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-stone-700 hover:text-stone-900 transition-colors"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  )
}
