'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
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
  id, label, type, name, autoComplete, placeholder,
  minLength, maxLength, pattern, value, onChange,
}: {
  id: string; label: string; type: string; name: string
  autoComplete: string; placeholder: string
  minLength?: number; maxLength?: number; pattern?: string
  value?: string; onChange?: (v: string) => void
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
          value={value}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
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
    </div>
  )
}

// ─── Password strength ────────────────────────────────────────────────────────

type StrengthLevel = 'empty' | 'weak' | 'fair' | 'strong' | 'great'

interface StrengthResult {
  level: StrengthLevel
  score: number        // 0–4
  label: string
  tip: string | null   // specific thing to fix
  color: string
}

function getStrength(password: string, username: string): StrengthResult {
  if (!password) return { level: 'empty', score: 0, label: '', tip: null, color: 'transparent' }

  const hasUpper   = /[A-Z]/.test(password)
  const hasLower   = /[a-z]/.test(password)
  const hasNumber  = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  const longEnough = password.length >= 8
  const containsUsername = username.length >= 3 &&
    password.toLowerCase().includes(username.toLowerCase())

  if (containsUsername) {
    return {
      level: 'weak', score: 1,
      label: 'weak',
      tip: "can't contain your username",
      color: '#ef4444',
    }
  }

  if (!longEnough) {
    return {
      level: 'weak', score: 1,
      label: 'weak',
      tip: `${8 - password.length} more character${8 - password.length !== 1 ? 's' : ''} needed`,
      color: '#ef4444',
    }
  }

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

  if (score <= 1) {
    const missing = !hasUpper ? 'uppercase letter' : !hasLower ? 'lowercase letter' : !hasNumber ? 'number' : 'symbol'
    return { level: 'weak', score: 1, label: 'weak', tip: `add a ${missing}`, color: '#ef4444' }
  }
  if (score === 2) {
    const missing = !hasUpper ? 'uppercase' : !hasNumber ? 'number' : !hasSpecial ? 'symbol' : 'uppercase'
    return { level: 'fair', score: 2, label: 'fair', tip: `try adding a ${missing}`, color: '#f97316' }
  }
  if (score === 3) {
    return { level: 'strong', score: 3, label: 'strong', tip: null, color: '#22c55e' }
  }
  return {
    level: 'great', score: 4,
    label: 'great password',
    tip: null,
    color: '#10b981',
  }
}

function PasswordStrength({ password, username }: { password: string; username: string }) {
  const result = getStrength(password, username)
  if (result.level === 'empty') return null

  return (
    <AnimatePresence>
      <motion.div
        key="strength"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        style={{ marginTop: 10 }}
      >
        {/* Bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {[1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: result.score >= i ? 1 : 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              style={{
                flex: 1, height: 2, borderRadius: 1,
                backgroundColor: result.score >= i ? result.color : 'rgba(26,25,22,0.10)',
                transformOrigin: 'left',
              }}
            />
          ))}
        </div>

        {/* Label + tip */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '0.72rem', color: result.color, transition: 'color 0.2s',
          }}>
            {result.label}
          </span>
          {result.tip && (
            <span style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: '0.68rem', color: 'rgba(26,25,22,0.38)',
            }}>
              — {result.tip}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function SignupForm({ error }: { error: string | null }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

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
            minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+"
            value={username} onChange={setUsername}
          />
          <p className="text-xs text-stone-300 mt-1.5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            3–20 chars · letters, numbers, underscores
          </p>
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
            minLength={8}
            value={password} onChange={setPassword}
          />
          <PasswordStrength password={password} username={username} />
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
