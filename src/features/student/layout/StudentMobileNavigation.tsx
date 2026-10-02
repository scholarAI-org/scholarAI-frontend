'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FOCUSABLE_SELECTOR, getFocusTrapTarget } from './focus-trap';
import { STUDENT_MOBILE_NAVIGATION_ID } from './StudentHeader';
import { StudentSidebar } from './StudentSidebar';

interface StudentMobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}

export function StudentMobileNavigation({
  isOpen,
  onClose,
  returnFocusRef,
}: StudentMobileNavigationProps) {
  const t = useTranslations('StudentLayout');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const returnTarget = returnFocusRef.current;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const target = getFocusTrapTarget(activeIndex, focusable.length, event.shiftKey);
      if (target !== null) {
        event.preventDefault();
        focusable[target].focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      returnTarget?.focus();
    };
  }, [isOpen, onClose, returnFocusRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="absolute inset-0 bg-[#1e1b33]/30" onClick={onClose} />
      <div
        ref={panelRef}
        id={STUDENT_MOBILE_NAVIGATION_ID}
        role="dialog"
        aria-modal="true"
        aria-label={t('navigationLabel')}
        className="absolute inset-y-0 end-0 flex w-[min(300px,85vw)] flex-col overflow-y-auto bg-white shadow-xl"
      >
        <div className="flex justify-end p-3">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('closeNavigation')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e2e8f0] text-[#274383]"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <StudentSidebar variant="drawer" onNavigate={onClose} />
      </div>
    </div>
  );
}
