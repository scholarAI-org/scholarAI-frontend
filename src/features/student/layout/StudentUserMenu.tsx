'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { GraduationCap, LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { getStudentDisplayName, getStudentInitial } from './student-identity';

interface StudentUserMenuProps {
  className?: string;
}

// Mobile account menu (below sm). The tab bar takes the five destinations, so the chrome
// that used to sit in the sidebar drawer — who you are, and logging out — lives here.
export function StudentUserMenu({ className = '' }: StudentUserMenuProps) {
  const t = useTranslations('StudentLayout');
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();
  const { mutate: logout, isPending } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const name = getStudentDisplayName(user, t('identity.fallbackName'));
  const initial = getStudentInitial(name);

  // Navigating away from under an open menu should not leave it hanging over the next
  // page. Adjusted during render rather than in an effect, so the menu never paints once
  // more on the new route before closing.
  const [openedAt, setOpenedAt] = useState(pathname);
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={t('userMenu.label')}
        className="flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        <span
          aria-hidden
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-[15px] text-white"
        >
          {initial}
        </span>
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={t('userMenu.label')}
          className="absolute end-0 top-full z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-300 bg-white p-2 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-[#f8fafc] px-3 py-2.5">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#274383] text-[15px] font-extrabold text-white"
            >
              {initial}
            </span>
            <div className="flex min-w-0 flex-col gap-1 text-start">
              <p className="truncate text-sm leading-[1.3] font-medium text-[#274383]">
                <bdi>{name}</bdi>
              </p>
              <p className="flex items-center gap-1 text-[10px] leading-none text-orange-500">
                <GraduationCap aria-hidden className="size-3" />
                <span className="truncate">{t('identity.role')}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => logout()}
            disabled={isPending}
            className="text-text-label mt-1 flex min-h-11 w-full items-center justify-start gap-2 rounded-xl px-3 text-sm transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* The arrow points out of the door; in Arabic the door is on the other side.
                Flipped from the active locale, not an rtl: variant, because the document
                root is always dir="rtl" (FE-23). */}
            <LogOut
              aria-hidden
              className={`size-5 shrink-0 ${locale === 'ar' ? 'rotate-180' : ''}`}
            />
            <span>{isPending ? t('logoutPending') : t('logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
