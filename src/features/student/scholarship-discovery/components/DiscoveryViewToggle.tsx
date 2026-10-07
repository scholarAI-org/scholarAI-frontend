'use client';

import { LayoutGrid, List, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DiscoveryView } from '../types';

const views: { value: DiscoveryView; icon: LucideIcon }[] = [
  { value: 'grid', icon: LayoutGrid },
  { value: 'list', icon: List },
];

interface DiscoveryViewToggleProps {
  value: DiscoveryView;
  onChange: (view: DiscoveryView) => void;
}

// Figma view toggle (2287:3435): a 52px pill with two 36px buttons. Changing the
// view is presentation only; it never touches the URL or any query.
export function DiscoveryViewToggle({ value, onChange }: DiscoveryViewToggleProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  return (
    <div
      role="group"
      aria-label={t('view.label')}
      className="flex h-[52px] shrink-0 overflow-hidden rounded-full border border-gray-300 bg-white"
    >
      {views.map(({ value: view, icon: Icon }) => {
        const pressed = view === value;
        return (
          <button
            key={view}
            type="button"
            aria-pressed={pressed}
            aria-label={t(`view.${view}`)}
            onClick={() => onChange(view)}
            className={`flex w-9 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#274383] ${pressed ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-[#f8fafc]'}`}
          >
            <Icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
