'use client';

import { BookOpen, Building2, MapPin, type LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  formatCardFieldLabel,
  getFundingLabel,
  getStudyLevelLabel,
  type CardFieldLabel,
} from '../lib/card-labels';
import { getScholarshipDetailsHref } from '../lib/details-link';
import type { ScholarshipCardModel } from '../types';
import { ScholarshipMatchBadge } from './ScholarshipMatchBadge';

// Shared pieces so Grid and List render the same model with the same actions.

function useCardFieldText() {
  const t = useTranslations('StudentScholarshipDiscovery');
  const locale = useLocale();
  return (label: CardFieldLabel) => formatCardFieldLabel(label, (key) => t(key), locale);
}

export function useCardTitle(card: ScholarshipCardModel) {
  const t = useTranslations('StudentScholarshipDiscovery');
  return card.title ?? t('card.untitled');
}

export function ScholarshipBadges({ card }: { card: ScholarshipCardModel }) {
  const fieldText = useCardFieldText();
  const funding = fieldText(getFundingLabel(card.fundingType));
  if (!funding && !card.match) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {funding ? (
        <span className="inline-flex h-6 items-center rounded-full bg-[rgba(22,193,114,0.06)] px-2 text-[10px] text-green-600">
          <bdi>{funding}</bdi>
        </span>
      ) : null}
      <ScholarshipMatchBadge match={card.match} />
    </div>
  );
}

export function ScholarshipTitle({ card, id }: { card: ScholarshipCardModel; id: string }) {
  const title = useCardTitle(card);
  const href = getScholarshipDetailsHref(card.id);
  return (
    <h3 id={id} className="text-base font-bold leading-6 text-black">
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
    </h3>
  );
}

function MetaRow({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-[#394d68]">
      <Icon aria-hidden className="size-4 shrink-0" />
      <bdi className="min-w-0 truncate">{children}</bdi>
    </li>
  );
}

// Only fields the backend provided; nothing is invented.
export function ScholarshipMeta({
  card,
  withProvider = false,
}: {
  card: ScholarshipCardModel;
  withProvider?: boolean;
}) {
  const fieldText = useCardFieldText();
  const level = fieldText(getStudyLevelLabel(card.studyLevel));
  const provider = withProvider ? (card.universityName ?? card.organizationName) : undefined;
  if (!card.country && !level && !provider) return null;
  return (
    <ul className="flex flex-col gap-2">
      {provider ? <MetaRow icon={Building2}>{provider}</MetaRow> : null}
      {card.country ? <MetaRow icon={MapPin}>{card.country}</MetaRow> : null}
      {level ? <MetaRow icon={BookOpen}>{level}</MetaRow> : null}
    </ul>
  );
}

// Hidden until the details route exists (getScholarshipDetailsHref returns null).
export function ScholarshipDetailsAction({ card }: { card: ScholarshipCardModel }) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const title = useCardTitle(card);
  const href = getScholarshipDetailsHref(card.id);
  if (!href) return null;
  return (
    <Link
      href={href}
      aria-label={t('card.detailsFor', { title })}
      className="inline-flex h-10 min-w-[120px] shrink-0 items-center justify-center rounded-full bg-orange-500 px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#274383]"
    >
      {t('card.details')}
    </Link>
  );
}
