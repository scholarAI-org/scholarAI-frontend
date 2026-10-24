'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  formatCardFieldLabel,
  getFundingLabel,
  getStudyLevelLabel,
  type CardFieldLabel,
} from '@/features/student/scholarship-discovery/lib/card-labels';
import { getScholarshipDetailsHref } from '@/features/student/scholarship-discovery/lib/details-link';
import type { UpcomingDeadline } from '../lib/derive-home-summary';
import { DeadlineBadge } from './DeadlineBadge';

interface DeadlineRowProps {
  item: UpcomingDeadline;
  detailsEnabled: boolean;
}

// Figma 2358:7670: title and "funding • level" at the start, urgency badge at the end.
export function DeadlineRow({ item, detailsEnabled }: DeadlineRowProps) {
  const locale = useLocale();
  const tCard = useTranslations('StudentScholarshipDiscovery');
  const labelText = (label: CardFieldLabel) =>
    formatCardFieldLabel(label, (key) => tCard(key), locale);

  const title = (locale === 'ar' ? item.title.ar : item.title.en) || item.title.default;
  const meta = [
    labelText(getFundingLabel(item.fundingType)),
    labelText(getStudyLevelLabel(item.studyLevel)),
  ]
    .filter(Boolean)
    .join(' • ');
  const href = getScholarshipDetailsHref(item.id, detailsEnabled);

  return (
    <li className="flex min-w-0 items-start justify-between gap-3 rounded-xl bg-[#f8fafc] p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="line-clamp-2 min-w-0 text-sm text-black">
          {href ? (
            <Link
              href={href}
              className="hover:text-[#274383] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              <bdi>{title}</bdi>
            </Link>
          ) : (
            <bdi>{title}</bdi>
          )}
        </p>
        {meta ? (
          <p data-row-meta className="min-w-0 truncate text-xs text-[#b5b5b5]">
            <bdi>{meta}</bdi>
          </p>
        ) : null}
      </div>
      <DeadlineBadge daysLeft={item.daysLeft} urgency={item.urgency} />
    </li>
  );
}
