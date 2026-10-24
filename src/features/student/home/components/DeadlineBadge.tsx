'use client';

import { useTranslations } from 'next-intl';
import type { DeadlineUrgency } from '../lib/urgency';

// Urgency colors from Figma 2358:7672: red, amber, green.
const STYLES: Record<DeadlineUrgency, string> = {
  urgent: 'bg-red-50 text-red-600',
  soon: 'bg-amber-50 text-amber-600',
  comfortable: 'bg-green-50 text-green-600',
};

interface DeadlineBadgeProps {
  daysLeft: number;
  urgency: DeadlineUrgency;
}

export function DeadlineBadge({ daysLeft, urgency }: DeadlineBadgeProps) {
  const t = useTranslations('StudentHome');
  return (
    <span
      data-urgency={urgency}
      className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[10px] whitespace-nowrap ${STYLES[urgency]}`}
    >
      {t('deadlines.daysLeft', { count: daysLeft })}
    </span>
  );
}
