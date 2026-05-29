'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { login } from './actions'

const field = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0  },
}

const INPUT_CLASS =
  'w-full bg-transparent outline-none text-base text-stone-900 pb-2 transition-colors placeholder:text-stone-300'
const INPUT_STYLE = { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }
const UNDERLINE_DEFAULT = '1px solid rgba(26,25,22,0.15)'

function Field({
  id, label, type, name, autoComplete, placeholder,
}: {
  id: string; label: string; type: string; name: string
  autoComplete: string; placeholder: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div
      className="relative pb-0 cursor-text"
      onClick={() => ref.current?.focus()}
    >
      <label
        htmlFor={id}
        className="block text-xs tracking-widest uppercase text-stone-400 mb-2.5"
      >
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        placeholder={placeholder}
        className={INPUT_CLASS}
        style={INPUT_STYLE}
        onFocus={(e)  => (e.currentTarget.parentElement!.querySelector('span')!.style.borderBottomColor = '#1a1916')}
        onBlur={(e)   => (e.currentTarget.parentElement!.querySelector('span')!.style.borderBottomColor = 'rgba(26,25,22,0.15)')}
      />
      <span
        className="block w-full"
        style={{ borderBottom: UNDERLINE_DEFAULT, transition: 'border-color 0.18s' }}
        aria-hidden
      />
    </div>
  )
}

export function LoginForm({ error }: { error: string | null }) {
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
          Welcome back.
        </h1>
        <p className="text-sm text-stone-400 mt-1.5">Sign in to pick up where you left off.</p>
      </motion.div>

      <form action={login} className="space-y-8">
        <motion.div variants={field}>
          <Field
            id="email" label="Email" type="email"
            name="email" autoComplete="email" placeholder="you@example.com"
          />
        </motion.div>

        <motion.div variants={field}>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs tracking-widest uppercase text-stone-400">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Forgot?
            </Link>
          </div>
          <div className="relative cursor-text">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
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
          <button
            type="submit"
            className="w-full py-3.5 text-sm text-white transition-colors mt-2"
            style={{
              backgroundColor: '#1a1916',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#44403c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a1916')}
          >
            Sign in
          </button>
        </motion.div>
      </form>

      {/* Switch */}
      <motion.p variants={field} className="mt-8 text-center text-sm text-stone-400">
        No account?{' '}
        <Link
          href="/signup"
          className="text-stone-700 hover:text-stone-900 transition-colors"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Sign up
        </Link>
      </motion.p>
    </motion.div>
  )
}
