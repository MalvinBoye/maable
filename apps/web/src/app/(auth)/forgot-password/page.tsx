import { ForgotForm } from './forgot-form'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const params = await searchParams
  return (
    <ForgotForm
      sent={params.sent === '1'}
      error={params.error ?? null}
    />
  )
}
