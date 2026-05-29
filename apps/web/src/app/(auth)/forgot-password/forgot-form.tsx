'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { sendResetEmail } from './actions'

const field = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0  },
}

const INPUT_CLASS =
  'w-full bg-transparent outline-none text-base text-stone-900 pb-2 transition-colors placeholder:text-stone-300'
const INPUT_STYLE = { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }
const UNDERLINE_DEFAULT = '1px solid rgba(26,25,22,0.15)'

export function ForgotForm({ sent, error }: { sent: boolean; error: string | null }) {
  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-3xl text-stone-900 leading-snug" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Check your inbox.
          </h1>
          <p className="text-sm text-stone-400 mt-1.5">
            If that email is registered, we sent a reset link. It expires in an hour.
          </p>
        </div>
        <Link
          href="/login"
          className="block text-center w-full py-3.5 text-sm text-white"
          style={{ backgroundColor: '#1a1916', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Back to sign in
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      <motion.div variants={field} className="mb-10">
        <h1 className="text-3xl text-stone-900 leading-snug" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Reset password.
        </h1>
        <p className="text-sm text-stone-400 mt-1.5">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </motion.div>

      <form action={sendResetEmail} className="space-y-8">
        <motion.div variants={field}>
          <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2.5">Email</label>
          <div className="relative cursor-text">
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
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
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Please enter a valid email address.
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
            Send reset link
          </button>
        </motion.div>
      </form>

      <motion.p variants={field} className="mt-8 text-center text-sm text-stone-400">
        Remember it?{' '}
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
