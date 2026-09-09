import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Almarai } from 'next/font/google';
import './globals.css';

const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['400', '700', '800'],
  variable: '--font-almarai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ScholarAI',
  description: 'ScholarAI Platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
