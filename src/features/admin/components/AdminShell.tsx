'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations('AdminShell');
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const closeNavigationRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsNavigationOpen(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    if (isNavigationOpen) closeNavigationRef.current?.focus();
  }, [isNavigationOpen]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-start text-[#434343] lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <div className="min-w-0 lg:order-2">
        <AdminHeader
          isNavigationOpen={isNavigationOpen}
          onNavigationToggle={() => setIsNavigationOpen((open) => !open)}
        />
        <main className="min-w-0 px-4 lg:px-6">{children}</main>
      </div>
      <div className="hidden min-h-screen lg:order-1 lg:row-span-2 lg:block">
        <AdminSidebar />
      </div>
      {isNavigationOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('navigationLabel')}
        >
          <button
            ref={closeNavigationRef}
            type="button"
            aria-label={t('closeNavigation')}
            className="absolute inset-0 bg-[#1e1b33]/30"
            onClick={() => setIsNavigationOpen(false)}
          />
          <div id="admin-mobile-navigation" className="absolute inset-y-0 end-0">
            <AdminSidebar onNavigate={() => setIsNavigationOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
