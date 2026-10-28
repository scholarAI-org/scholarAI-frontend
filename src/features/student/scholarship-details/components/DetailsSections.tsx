'use client';

import { CircleCheck, ExternalLink, FileText, Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import {
  getFundingLabel,
  getStudyLevelLabel,
} from '@/features/student/scholarship-discovery/lib/card-labels';
import { ScholarshipDeadline } from '@/features/student/scholarship-discovery/components/ScholarshipDeadline';
import {
  getDateFacts,
  getEligibilityFacts,
  getSourceItems,
  getVisibleSections,
  type EligibilityFact,
} from '../lib/sections';
import type { ScholarshipDetailsViewModel } from '../types';
import {
  DetailsCard,
  FactTile,
  SafeLink,
  linkClasses,
  useDateText,
  useFieldText,
} from './DetailsParts';

const externalIcon = (
  <ExternalLink aria-hidden className="size-4 shrink-0 [&:dir(rtl)]:-scale-x-100" />
);

// The main column: one card per section, each only when it has data.
export function DetailsSections({
  details,
  now,
}: {
  details: ScholarshipDetailsViewModel;
  now: Date;
}) {
  const t = useTranslations('StudentScholarshipDetails');
  const tCard = useTranslations('StudentScholarshipDiscovery');
  const fieldText = useFieldText();
  const dateText = useDateText();
  const ids = useId();
  const visible = getVisibleSections(details);
  const eligibilityFacts = getEligibilityFacts(details);
  const dateFacts = getDateFacts(details);
  const source = getSourceItems(details);
  const funding = fieldText(getFundingLabel(details.fundingType));

  const eligibilityValue = (fact: EligibilityFact) => {
    if (fact.kind === 'levels') {
      return <bdi>{fieldText(getStudyLevelLabel(fact.levels.join(', ')))}</bdi>;
    }
    if (fact.kind === 'chips') {
      return (
        <ul className="flex flex-wrap gap-2">
          {fact.items.map((item, index) => (
            <li
              key={`${index}-${item}`}
              className="rounded-full bg-white px-3 py-1 text-sm text-[#434343] ring-1 ring-gray-300"
            >
              <bdi>{item}</bdi>
            </li>
          ))}
        </ul>
      );
    }
    return <bdi>{fact.text}</bdi>;
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
      {visible.about ? (
        <DetailsCard id={`${ids}-about`} title={t('sections.about')}>
          <dl className="grid gap-3 xl:grid-cols-2">
            {details.organizationName ? (
              <FactTile label={t('fields.provider')}>
                <bdi>{details.organizationName}</bdi>
              </FactTile>
            ) : null}
            {details.universityName ? (
              <FactTile label={t('fields.university')}>
                <bdi>{details.universityName}</bdi>
              </FactTile>
            ) : null}
            {details.country ? (
              <FactTile label={t('fields.country')}>
                <bdi>{details.country}</bdi>
              </FactTile>
            ) : null}
            {details.opportunityType ? (
              <FactTile label={t('fields.opportunityType')}>
                {tCard(`filters.opportunity.${details.opportunityType}`)}
              </FactTile>
            ) : null}
          </dl>
        </DetailsCard>
      ) : null}

      {visible.funding ? (
        <DetailsCard id={`${ids}-funding`} title={t('sections.funding')}>
          <dl className="grid gap-3 xl:grid-cols-2">
            {funding ? (
              <FactTile label={t('fields.fundingType')}>
                <bdi>{funding}</bdi>
              </FactTile>
            ) : null}
            {details.fundingAmount ? (
              <FactTile label={t('fields.fundingAmount')}>
                <bdi>{details.fundingAmount}</bdi>
              </FactTile>
            ) : null}
          </dl>
        </DetailsCard>
      ) : null}

      {visible.eligibility ? (
        <DetailsCard id={`${ids}-eligibility`} title={t('sections.eligibility')}>
          {eligibilityFacts.length > 0 ? (
            <dl className="grid gap-3 xl:grid-cols-2">
              {eligibilityFacts.map((fact) => (
                <div
                  key={fact.field}
                  className={fact.kind === 'chips' ? 'xl:col-span-2' : undefined}
                >
                  <FactTile
                    label={t(`fields.${fact.field === 'studyLevels' ? 'studyLevel' : fact.field}`)}
                  >
                    {eligibilityValue(fact)}
                  </FactTile>
                </div>
              ))}
            </dl>
          ) : null}
          {details.eligibilityCriteria.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {details.eligibilityCriteria.map((item, index) => (
                <li
                  key={`${index}-${item}`}
                  className="flex items-start gap-2 text-sm leading-6 text-[#434343]"
                >
                  <CircleCheck aria-hidden className="mt-1 size-4 shrink-0 text-[#16c172]" />
                  <bdi className="min-w-0 break-words">{item}</bdi>
                </li>
              ))}
            </ul>
          ) : null}
        </DetailsCard>
      ) : null}

      {visible.documents ? (
        <DetailsCard id={`${ids}-documents`} title={t('sections.documents')}>
          <ol className="flex flex-col gap-3">
            {details.requiredDocuments.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="flex items-start gap-3 rounded-full border border-gray-300 bg-[#f8fafc] px-4 py-2.5 text-sm leading-6 text-[#434343]"
              >
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(22,193,114,0.08)] text-xs font-bold text-green-700"
                >
                  {index + 1}
                </span>
                <bdi className="min-w-0 break-words">{item}</bdi>
              </li>
            ))}
          </ol>
        </DetailsCard>
      ) : null}

      {visible.dates ? (
        <DetailsCard id={`${ids}-dates`} title={t('sections.dates')}>
          <dl className="grid gap-3 xl:grid-cols-2">
            {dateFacts.map((fact) => (
              <FactTile key={fact.field} label={t(`fields.${fact.field}`)}>
                {fact.field === 'deadline' ? (
                  <ScholarshipDeadline
                    card={{
                      id: details.id,
                      deadline: details.deadline,
                      noDeadline: details.noDeadline,
                      isSaved: details.isSaved,
                    }}
                    now={now}
                  />
                ) : fact.field === 'openingDate' ? (
                  <time dateTime={fact.value}>{dateText.calendar(fact.value)}</time>
                ) : (
                  <time dateTime={fact.value.toISOString()}>{dateText.instant(fact.value)}</time>
                )}
              </FactTile>
            ))}
          </dl>
        </DetailsCard>
      ) : null}

      {visible.source ? (
        <DetailsCard id={`${ids}-source`} title={t('sections.source')}>
          <ul className="flex flex-col gap-3 text-sm leading-6 text-[#434343]">
            {source.source ? (
              <li className="flex flex-wrap items-center gap-x-2">
                <span className="text-[#64748b]">{t('fields.source')}</span>
                {source.source.href ? (
                  <SafeLink
                    href={source.source.href}
                    external
                    className={`inline-flex items-center gap-1.5 ${linkClasses}`}
                  >
                    <bdi>{source.source.text}</bdi>
                    {externalIcon}
                  </SafeLink>
                ) : (
                  <bdi>{source.source.text}</bdi>
                )}
              </li>
            ) : null}
            {source.pdfUrl ? (
              <li className="flex items-center gap-2">
                <FileText aria-hidden className="size-4 shrink-0 text-[#64748b]" />
                <SafeLink
                  href={source.pdfUrl}
                  external
                  className={`inline-flex items-center gap-1.5 ${linkClasses}`}
                >
                  {t('fields.pdf')}
                  {externalIcon}
                </SafeLink>
              </li>
            ) : null}
            {source.attachments.map((href, index) => (
              <li key={href} className="flex items-center gap-2">
                <Paperclip aria-hidden className="size-4 shrink-0 text-[#64748b]" />
                <SafeLink
                  href={href}
                  external
                  className={`inline-flex items-center gap-1.5 ${linkClasses}`}
                >
                  {t('attachmentItem', { count: index + 1 })}
                  {externalIcon}
                </SafeLink>
              </li>
            ))}
          </ul>
        </DetailsCard>
      ) : null}
    </div>
  );
}
