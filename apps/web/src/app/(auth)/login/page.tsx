import { LoginForm } from './login-form'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Incorrect email or password.',
  missing_fields:      'Please fill in all fields.',
  invalid_email:       'Please enter a valid email address.',
  unknown:             'Something went wrong. Please try again.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong.') : null
  return <LoginForm error={errorMessage} />
}
