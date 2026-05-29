import { SignupForm } from './signup-form'

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields:   'Please fill in all fields.',
  invalid_email:    'Please enter a valid email address.',
  weak_password:    'Password must be at least 8 characters.',
  invalid_username: 'Username: 3–20 chars, letters/numbers/underscores only.',
  email_taken:      'An account with this email already exists.',
  unknown:          'Something went wrong. Please try again.',
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong.') : null
  return <SignupForm error={errorMessage} />
}
