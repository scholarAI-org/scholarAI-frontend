'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/shared/Container';
import { Logo } from '@/components/shared/Logo';
import { buttonStyles } from '@/components/ui/Button';
import { MenuIcon, CloseIcon } from '@/components/icons';

const NAV_LINKS = [
  { key: 'home', href: '/', active: true },
  { key: 'howItWorks', href: '#how-it-works', active: false },
  { key: 'features', href: '#features', active: false },
  { key: 'about', href: '#about', active: false },
  { key: 'contact', href: '#contact', active: false },
] as const;

export function Navbar() {
  const t = useTranslations('Landing.nav');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_4px_16px_rgba(10,34,67,0.06)]">
      <Container className="flex h-[71px] items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-2 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={[
                'relative px-2.5 py-2.5 text-sm transition-colors',
                link.active
                  ? 'font-medium text-[var(--color-primary)]'
                  : 'text-[var(--color-gray-400)] hover:text-[var(--color-navy-800)]',
              ].join(' ')}
            >
              {t(link.key)}
              {link.active && (
                <span className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            {t('login')}
          </Link>
          <Link href="/register" className={buttonStyles({ variant: 'primary', size: 'sm' })}>
            {t('start')}
          </Link>
        </div>

        <button
          type="button"
          aria-label={t('menuToggle')}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-navy-800)] lg:hidden"
        >
          {isOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </Container>

      {isOpen && (
        <div className="border-t border-[var(--color-border-default)] bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={[
                  'rounded-lg px-3 py-2.5 text-sm',
                  link.active
                    ? 'font-medium text-[var(--color-primary)]'
                    : 'text-[var(--color-gray-400)]',
                ].join(' ')}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'flex-1' })}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className={buttonStyles({ variant: 'primary', size: 'sm', className: 'flex-1' })}
              >
                {t('start')}
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
