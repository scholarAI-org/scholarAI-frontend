import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return params.then(({ locale }) =>
    buildPageMetadata({ locale, pathname: '/reset-password', page: 'resetPassword', noindex: true })
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token.trim() : undefined;

  return <ResetPasswordForm token={token || undefined} />;
}
