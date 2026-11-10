import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return params.then(({ locale }) =>
    buildPageMetadata({ locale, pathname: '/register', page: 'register' })
  );
}

export default function RegisterPage() {
  return (
    <div>
      <RegisterForm />
    </div>
  );
}
