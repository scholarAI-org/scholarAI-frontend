'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { navigationIcons } from './navigation-icons';
import {
  getActiveStudentTabId,
  getStudentTabBarItems,
  studentTabLabelKey,
} from './student-navigation';

import type { StudentNavigationItem } from './types';

interface StudentTabBarProps {
  items: readonly StudentNavigationItem[];
}

// Mobile bottom navigation (below sm). The Figma mobile notes (3607:10840) replace the
// sidebar with a five-destination tab bar; the items come from the same nav config the
// sidebar uses, so a feature flag hides a tab here too and the row closes up.
export function StudentTabBar({ items }: StudentTabBarProps) {
  const t = useTranslations('StudentLayout');
  const pathname = usePathname();
  const tabs = getStudentTabBarItems(items);
  const activeId = getActiveStudentTabId(pathname, items);

  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label={t('tabBarLabel')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-300 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="flex items-stretch">
        {tabs.map((item) => {
          const Icon = navigationIcons[item.id];
          const active = item.id === activeId;
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'relative flex min-h-11 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] leading-tight transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-500',
                  active ? 'font-bold text-orange-500' : 'text-text-label',
                ].join(' ')}
              >
                {/* The sidebar marks the active item with an orange edge; the bar does the
                    same along its top, which reads the same way in both directions. */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-orange-500"
                  />
                )}
                <Icon aria-hidden className="size-5 shrink-0" />
                <span className="w-full truncate text-center">
                  {t(studentTabLabelKey(item.id))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
