import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return params.then(({ locale }) =>
    buildPageMetadata({ locale, pathname: '/forgot-password', page: 'forgotPassword' })
  );
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
