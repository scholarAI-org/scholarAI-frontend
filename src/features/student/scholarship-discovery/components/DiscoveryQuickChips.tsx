'use client';

import { useTranslations } from 'next-intl';
import { getQuickChips, quickChipPatch } from '../lib/quick-chips';
import type { DiscoveryFilterPatch, DiscoveryQuery } from '../types';

interface DiscoveryQuickChipsProps {
  query: DiscoveryQuery;
  onChange: (patch: DiscoveryFilterPatch) => void;
}

// Figma chips (3606:11301), below lg only: toggle buttons bound to the same URL
// state as the academic-level checkboxes. The row scrolls on its own.
export function DiscoveryQuickChips({ query, onChange }: DiscoveryQuickChipsProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  return (
    <div
      role="group"
      aria-label={t('filters.academicLevel.legend')}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden [&::-webkit-scrollbar]:hidden"
    >
      {getQuickChips(query).map((chip) => (
        <button
          key={chip.id}
          type="button"
          aria-pressed={chip.pressed}
          onClick={() => onChange(quickChipPatch(query, chip.id))}
          className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${chip.pressed ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 bg-white text-[#274383] hover:bg-[#f8fafc]'}`}
        >
          {chip.id === 'all' ? t('chips.all') : t(`filters.academicLevel.${chip.id}`)}
        </button>
      ))}
    </div>
  );
}
