import { UpdateForm } from './update-form'

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return <UpdateForm error={params.error ?? null} />
}
