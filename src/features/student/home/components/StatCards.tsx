'use client';

import { BarChart3, Bell, CalendarDays, Heart, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatCard, type StatId, type StatView } from './StatCard';

interface StatCardsProps {
  // Shown only while a notifications source exists; without it the row has 3 cards.
  notifications?: StatView;
  saved: StatView;
  inProgress: StatView;
  upcoming: StatView;
}

// Static class strings so Tailwind can see them. The row always fills its width
// evenly: 3 cards (no notifications source) or 4.
const GRID_CLASS: Record<3 | 4, string> = {
  3: 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const CARD_STYLE: Record<StatId, { icon: LucideIcon; chip: string }> = {
  notifications: { icon: Bell, chip: 'bg-blue-50 text-blue-500' },
  saved: { icon: Heart, chip: 'bg-red-50 text-red-500' },
  inProgress: { icon: BarChart3, chip: 'bg-green-50 text-green-600' },
  upcoming: { icon: CalendarDays, chip: 'bg-orange-50 text-orange-500' },
};

export function StatCards({ notifications, saved, inProgress, upcoming }: StatCardsProps) {
  const t = useTranslations('StudentHome');
  const cards: { id: StatId; view: StatView }[] = [
    ...(notifications ? [{ id: 'notifications' as const, view: notifications }] : []),
    { id: 'saved', view: saved },
    { id: 'inProgress', view: inProgress },
    { id: 'upcoming', view: upcoming },
  ];

  return (
    <ul className={`grid min-w-0 gap-4 ${GRID_CLASS[cards.length === 4 ? 4 : 3]}`}>
      {cards.map(({ id, view }) => (
        <StatCard
          key={id}
          id={id}
          label={t(`stats.${id}`)}
          icon={CARD_STYLE[id].icon}
          chipClassName={CARD_STYLE[id].chip}
          view={view}
        />
      ))}
    </ul>
  );
}
