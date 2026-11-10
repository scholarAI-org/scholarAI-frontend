import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Almarai } from 'next/font/google';
import { resolveSiteUrl } from '@/lib/site-url';
import './globals.css';

const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['400', '700', '800'],
  variable: '--font-almarai',
  display: 'swap',
});

// Fallback for anything rendered outside /[locale] (global-error). Localized
// pages override this from src/app/[locale]/layout.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: 'ScholarAI',
  description:
    'Discover study funding opportunities around the world and keep your academic profile and documents in one place.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
