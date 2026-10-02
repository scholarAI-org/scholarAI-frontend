'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { StudentHeader } from './StudentHeader';
import { StudentMobileNavigation } from './StudentMobileNavigation';
import { StudentSidebar } from './StudentSidebar';

// Shared student frame, mounted once by src/app/[locale]/student/layout.tsx.
export function StudentShell({ children }: { children: ReactNode }) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeNavigation = useCallback(() => setIsNavigationOpen(false), []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-start text-[#434343]">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[236px_minmax(0,1204px)] lg:gap-0 lg:px-0 lg:py-0">
        <div className="min-w-0 lg:order-2">
          <StudentHeader
            isNavigationOpen={isNavigationOpen}
            onNavigationToggle={() => setIsNavigationOpen((open) => !open)}
            menuButtonRef={menuButtonRef}
          />
          <main className="pt-4 lg:px-6 lg:pt-6">{children}</main>
        </div>
        <aside className="hidden lg:order-1 lg:row-span-2 lg:block">
          <StudentSidebar />
        </aside>
      </div>
      <StudentMobileNavigation
        isOpen={isNavigationOpen}
        onClose={closeNavigation}
        returnFocusRef={menuButtonRef}
      />
    </div>
  );
}
