import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import { EmailVerificationSuccess } from '@/features/auth/components/EmailVerificationSuccess';

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return params.then(({ locale }) =>
    buildPageMetadata({
      locale,
      pathname: '/verify-email/success',
      page: 'verifyEmailSuccess',
      noindex: true,
    })
  );
}

export default function EmailVerificationSuccessPage() {
  return <EmailVerificationSuccess />;
}
