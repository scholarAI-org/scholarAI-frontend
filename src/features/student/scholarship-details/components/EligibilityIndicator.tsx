'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';
import { getStudyLevelLabel } from '@/features/student/scholarship-discovery/lib/card-labels';
import { useScholarshipEligibility } from '../hooks/useScholarshipEligibility';
import type { EligibilityCriterion } from '../lib/eligibility-adapter';
import { DetailsCard, focusRing, useFieldText } from './DetailsParts';

const GENDER_CODES = {
  male: 'male',
  female: 'female',
  any: 'any',
  all: 'any',
  both: 'any',
} as const;

function Chip({ tone, children }: { tone: 'amber' | 'green'; children: ReactNode }) {
  const classes =
    tone === 'amber' ? 'bg-[#fff7ed] text-[#b45309]' : 'bg-[rgba(22,193,114,0.08)] text-green-700';
  return (
    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${classes}`}>{children}</span>
  );
}

// Display-only eligibility indicator. It lists the scholarship's own structured
// criteria (GET /eligibility); it does not compare them with the student's
// profile. Labels come from stable codes localized here, and the values are the
// backend's data (countries, fields, languages), never sentences.
export function EligibilityIndicator({ id }: { id: number }) {
  const t = useTranslations('StudentScholarshipEligibility');
  const fieldText = useFieldText();
  const ids = useId();
  const query = useScholarshipEligibility(id);

  const value = (criterion: EligibilityCriterion): ReactNode => {
    switch (criterion.kind) {
      case 'list':
      case 'levels': {
        if (criterion.values.length === 0) return t('values.noRestriction');
        const items =
          criterion.kind === 'levels'
            ? criterion.values.map((level) => fieldText(getStudyLevelLabel(level)) ?? level)
            : criterion.values;
        return (
          <ul className="flex flex-wrap gap-1.5">
            {items.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="rounded-full bg-white px-2.5 py-0.5 text-sm text-[#434343] ring-1 ring-gray-300"
              >
                <bdi>{item}</bdi>
              </li>
            ))}
          </ul>
        );
      }
      case 'gender': {
        const code = GENDER_CODES[criterion.value.toLowerCase() as keyof typeof GENDER_CODES];
        return <bdi>{code ? t(`gender.${code}`) : criterion.value}</bdi>;
      }
      case 'percent':
        return t('values.percent', { count: criterion.value });
      case 'years':
        return t('values.years', { count: criterion.value });
      case 'flag':
        return criterion.required ? (
          <Chip tone="amber">{t('values.required')}</Chip>
        ) : (
          <Chip tone="green">{t('values.notRequired')}</Chip>
        );
    }
  };

  // Nothing is known about the criteria: no card rather than an empty one.
  if (query.isSuccess && query.data.criteria.length === 0) return null;

  let body: ReactNode;
  if (query.isPending) {
    body = (
      <p role="status" className="flex items-center gap-2 text-sm text-[#64748b]">
        <Loader2 aria-hidden className="size-4 animate-spin" />
        {t('loading')}
      </p>
    );
  } else if (query.isError) {
    body = (
      <div role="alert" className="flex flex-col items-start gap-2 text-sm">
        <p className="text-[var(--color-text-error)]">{t('loadError')}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className={`rounded-full border border-gray-300 px-4 py-1.5 text-[#274383] hover:bg-[#f8fafc] ${focusRing}`}
        >
          {t('retry')}
        </button>
      </div>
    );
  } else {
    body = (
      <>
        <dl className="flex flex-col gap-3">
          {query.data.criteria.map((criterion) => (
            <div
              key={criterion.code}
              className="flex flex-col gap-1.5 rounded-xl bg-[#f8fafc] px-4 py-3"
            >
              <dt className="text-xs leading-5 text-[#64748b]">
                {t(`criteria.${criterion.code}`)}
              </dt>
              <dd className="text-sm leading-6 break-words text-[#434343]">{value(criterion)}</dd>
            </div>
          ))}
        </dl>
        {query.data.unknownCount > 0 ? (
          <p className="text-xs leading-5 text-[#64748b]">
            {t('unknown', { count: query.data.unknownCount })}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <DetailsCard id={`${ids}-title`} title={t('title')}>
      {query.isSuccess ? <p className="text-xs leading-5 text-[#64748b]">{t('note')}</p> : null}
      {body}
    </DetailsCard>
  );
}
