import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm';

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return params.then(({ locale }) =>
    buildPageMetadata({ locale, pathname: '/verify-email', page: 'verifyEmail', noindex: true })
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === 'string' ? params.email.trim() : undefined;

  return <VerifyEmailForm email={email || undefined} />;
}
