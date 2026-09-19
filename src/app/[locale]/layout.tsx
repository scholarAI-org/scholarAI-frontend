import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { QueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ar' | 'en')) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <QueryProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <div dir={dir} lang={locale} className="min-h-full flex flex-col flex-1">
            {children}
          </div>
        </AuthProvider>
      </NextIntlClientProvider>
    </QueryProvider>
  );
}
