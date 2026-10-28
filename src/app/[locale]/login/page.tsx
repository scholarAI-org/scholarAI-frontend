import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import { LoginForm } from '@/features/auth/components/LoginForm';

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return params.then(({ locale }) =>
    buildPageMetadata({ locale, pathname: '/login', page: 'login' })
  );
}

export default function LoginPage() {
  return (
    <div>
      <LoginForm />
    </div>
  );
}
