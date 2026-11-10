'use client';

import { CalendarDays, GraduationCap, Wallet, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';
import {
  getFundingLabel,
  getStudyLevelLabel,
} from '@/features/student/scholarship-discovery/lib/card-labels';
import { ScholarshipDeadline } from '@/features/student/scholarship-discovery/components/ScholarshipDeadline';
import { ScholarshipImage } from '@/features/student/scholarship-discovery/components/ScholarshipImage';
import type { ScholarshipApplicationStatus, ScholarshipDetailsViewModel } from '../types';
import { useFieldText } from './DetailsParts';

const statusClasses: Record<Exclude<ScholarshipApplicationStatus, 'unknown'>, string> = {
  open: 'bg-white text-green-700',
  upcoming: 'bg-white text-[#b45309]',
  closed: 'bg-white text-[#475569]',
};

function HeroMeta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon aria-hidden className="size-[18px] shrink-0" />
      {children}
    </li>
  );
}

// Header per Figma 2481:4537: the image with the title and the key facts over it.
export function DetailsHero({
  details,
  titleId,
  now,
}: {
  details: ScholarshipDetailsViewModel;
  titleId: string;
  now: Date;
}) {
  const t = useTranslations('StudentScholarshipDetails');
  const tCard = useTranslations('StudentScholarshipDiscovery');
  const fieldText = useFieldText();
  const level = fieldText(getStudyLevelLabel(details.studyLevels.join(', ')));
  const funding = fieldText(getFundingLabel(details.fundingType));
  const status = details.applicationStatus === 'unknown' ? null : details.applicationStatus;
  const card = { id: details.id, deadline: details.deadline, noDeadline: details.noDeadline };

  return (
    <div className="relative">
      <ScholarshipImage
        src={details.imageUrl}
        alt={tCard('card.imageAlt', { title: details.title })}
        className="h-[234px] rounded-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.65)_100%)]"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6">
        <h2 id={titleId} className="text-2xl leading-[1.4] font-bold break-words text-white">
          <bdi>{details.title}</bdi>
        </h2>
        <ul
          aria-label={t('summary')}
          className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-sm font-medium text-white"
        >
          {status ? (
            <li
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusClasses[status]}`}
              aria-label={`${t('fields.applicationStatus')}: ${t(`applicationStatus.${status}`)}`}
            >
              {t(`applicationStatus.${status}`)}
            </li>
          ) : null}
          <HeroMeta icon={CalendarDays}>
            <ScholarshipDeadline card={{ ...card, isSaved: details.isSaved }} now={now} />
          </HeroMeta>
          {level ? (
            <HeroMeta icon={GraduationCap}>
              <bdi>{level}</bdi>
            </HeroMeta>
          ) : null}
          {funding ? (
            <HeroMeta icon={Wallet}>
              <bdi>{funding}</bdi>
            </HeroMeta>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
