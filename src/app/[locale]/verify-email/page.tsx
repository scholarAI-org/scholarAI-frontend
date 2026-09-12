import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === 'string' ? params.email.trim() : undefined;

  return <VerifyEmailForm email={email || undefined} />;
}
