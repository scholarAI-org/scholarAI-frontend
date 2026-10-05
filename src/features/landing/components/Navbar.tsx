'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { landingMotion } from '../motion';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/shared/Container';
import { buttonStyles } from '@/components/ui/Button';
import { MenuIcon, CloseIcon } from '@/components/icons';
import { LandingLogo } from './LandingLogo';
import { DesignAsset } from './DesignAsset';

const NAV_LINKS = [
  { key: 'home', href: '/' },
  { key: 'howItWorks', href: '#how-it-works' },
  { key: 'features', href: '#features' },
  { key: 'about', href: '#about' },
  { key: 'contact', href: '#contact' },
] as const;

function MobileMenu({ children, label }: { children: ReactNode; label: string }) {
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();
  return (
    <motion.nav
      id="landing-mobile-nav"
      className="landing-mobile-nav"
      aria-label={label}
      aria-hidden={!present}
      inert={!present}
      initial={reducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
      transition={{
        duration: reducedMotion ? 0 : landingMotion.feedback,
        ease: [...landingMotion.ease],
      }}
    >
      {children}
    </motion.nav>
  );
}

export function Navbar() {
  const t = useTranslations('Landing.updated.nav');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);
  const links = NAV_LINKS.map(({ key, href }) => (
    <Link
      key={key}
      href={href}
      onClick={() => setIsOpen(false)}
      className={key === 'home' ? 'active' : undefined}
      aria-current={key === 'home' ? 'page' : undefined}
    >
      {t(key)}
    </Link>
  ));
  const actions = (
    <>
      <Link
        href="/"
        locale={locale === 'ar' ? 'en' : 'ar'}
        className="landing-nav-circle"
        aria-label={t('language')}
      >
        {locale === 'ar' ? 'En' : 'ع'}
      </Link>
      <button
        type="button"
        className="landing-nav-circle"
        disabled
        aria-label={t('themeUnavailable')}
        title={t('themeUnavailable')}
      >
        <DesignAsset name="2104-2444-imgSun1" />
      </button>
      <Link href="/login" className="landing-login">
        {t('login')}
      </Link>
      <Link
        href="/register"
        className={buttonStyles({ variant: 'landing', className: 'landing-small' })}
      >
        {t('start')}
      </Link>
    </>
  );
  return (
    <header className="landing-nav">
      <Container className="landing-nav-inner">
        <LandingLogo />
        <nav className="landing-desktop-nav" aria-label={t('menu')}>
          {links}
        </nav>
        <div className="landing-nav-actions">{actions}</div>
        <button
          type="button"
          aria-label={t('menu')}
          aria-expanded={isOpen}
          aria-controls={isOpen ? 'landing-mobile-nav' : undefined}
          ref={toggle}
          onClick={() => setIsOpen(!isOpen)}
          className="landing-menu-toggle"
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </Container>
      <AnimatePresence initial={false}>
        {isOpen && (
          <MobileMenu label={t('menu')}>
            {links}
            <div>{actions}</div>
          </MobileMenu>
        )}
      </AnimatePresence>
    </header>
  );
}
