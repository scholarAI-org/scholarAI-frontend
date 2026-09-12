import Image from 'next/image';
import type { ReactNode } from 'react';
import { AuthUtilityHeader } from './AuthUtilityHeader';

export function EmailVerificationLayout({
  children,
  backHref = '/register',
}: {
  children: ReactNode;
  backHref?: '/login' | '/register';
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-1/2 overflow-hidden bg-[#193956] lg:block">
        <Image
          src="/images/auth-verification-bg.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,57,86,0.75)_17%,rgba(25,57,86,0.4)_48%,rgba(25,57,86,0.88)_100%)]" />
      </div>
      <main className="flex min-h-screen w-full justify-center px-5 py-8 sm:px-8 lg:w-1/2 lg:px-10 lg:py-16">
        <div className="flex w-full max-w-[510px] flex-col">
          <AuthUtilityHeader backHref={backHref} />
          <div className="flex flex-1 flex-col justify-center py-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
