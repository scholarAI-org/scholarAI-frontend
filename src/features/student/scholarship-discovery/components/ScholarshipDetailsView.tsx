'use client';

import {
  CalendarDays,
  CircleCheck,
  ExternalLink,
  GraduationCap,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState, type ReactNode } from 'react';
import { toFormattingLocale } from '@/i18n/formatting';
import {
  formatCardFieldLabel,
  getFundingLabel,
  getStudyLevelLabel,
  type CardFieldLabel,
} from '../lib/card-labels';
import { getDetailsFacts, getDetailsLists, type DetailsFact } from '../lib/details-fields';
import { getApplyLinks, type ApplyLink } from '../lib/safe-links';
import type { ScholarshipDetailsModel } from '../types';
import { ScholarshipBookmark } from './ScholarshipBookmark';
import { ScholarshipDeadline } from './ScholarshipDeadline';
import { ScholarshipImage } from './ScholarshipImage';

// Factual summary laid out per Figma 2481:4537 (desktop), 3610:8390 (tablet) and
// 3606:11330 (mobile). Only backend fields are shown; the Figma eligibility
// assessment, application status, support card, similar scholarships and the
// HTML description are out of scope (description_html is never rendered).

const cardClasses = 'rounded-[18px] border border-gray-300 bg-white p-4 sm:p-5';
const headingClasses = 'text-lg font-bold leading-7 text-black';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500';
// The orange apply button takes the navy ring so focus stays visible on it.
const ctaFocusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#274383]';

function NewTabHint() {
  const t = useTranslations('StudentScholarshipDetails');
  return <span className="sr-only"> {t('opensInNewTab')}</span>;
}

// External links open in a new tab without access to this page.
function SafeLink({
  href,
  external,
  className,
  children,
  dir,
}: {
  href: string;
  external: boolean;
  className: string;
  children: ReactNode;
  dir?: 'ltr';
}) {
  return (
    <a
      href={href}
      dir={dir}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
      {external ? <NewTabHint /> : null}
    </a>
  );
}

function HeroMeta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon aria-hidden className="size-[18px] shrink-0" />
      {children}
    </li>
  );
}

function ListSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${cardClasses} flex flex-col gap-4`}>
      <h3 id={id} className={headingClasses}>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ScholarshipDetailsView({ details }: { details: ScholarshipDetailsModel }) {
  const t = useTranslations('StudentScholarshipDetails');
  const tCard = useTranslations('StudentScholarshipDiscovery');
  const locale = useLocale();
  const ids = useId();
  // One "today" for every deadline on the page.
  const [now] = useState(() => new Date());

  const title = details.title ?? tCard('card.untitled');
  const fieldText = (label: CardFieldLabel) =>
    formatCardFieldLabel(label, (key) => tCard(key), locale);
  const level = fieldText(getStudyLevelLabel(details.studyLevel));
  const funding = fieldText(getFundingLabel(details.fundingType));
  const facts = getDetailsFacts(details);
  const lists = getDetailsLists(details);
  const majors = lists.find((list) => list.field === 'majors');
  const eligibility = lists.find((list) => list.field === 'eligibilityCriteria');
  const documents = lists.find((list) => list.field === 'requiredDocuments');
  const applyLinks = getApplyLinks(details);
  const applyWeb = applyLinks.find((link) => link.kind === 'link');
  const contacts = applyLinks.filter((link) => link.kind !== 'link');

  function factValue(fact: DetailsFact): ReactNode {
    switch (fact.kind) {
      case 'text':
        return <bdi>{fact.text}</bdi>;
      case 'label':
        return <bdi>{fieldText(fact.label)}</bdi>;
      case 'opportunity':
        return tCard(`filters.opportunity.${fact.value}`);
      case 'deadline':
        return <ScholarshipDeadline card={details} now={now} />;
      case 'date':
        return (
          <time dateTime={fact.value.toISOString()}>
            {new Intl.DateTimeFormat(toFormattingLocale(locale), {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(fact.value)}
          </time>
        );
      case 'source':
        return fact.href ? (
          <SafeLink
            href={fact.href}
            external
            className={`break-words text-[#274383] underline underline-offset-2 hover:text-orange-500 ${focusRing}`}
          >
            <bdi>{fact.text}</bdi>
          </SafeLink>
        ) : (
          <bdi>{fact.text}</bdi>
        );
    }
  }

  const contactLabel = (link: ApplyLink) =>
    link.kind === 'email' ? t('fields.applyEmail') : t('fields.applyPhone');

  return (
    <article aria-labelledby={`${ids}-title`} className="flex flex-col gap-5 lg:gap-6">
      {/* Hero: image with the title over it from sm; below sm the title follows it. */}
      <div className="relative">
        <ScholarshipImage
          src={details.imageUrl}
          alt={tCard('card.imageAlt', { title })}
          className="h-[190px] rounded-2xl sm:h-[260px] sm:rounded-[20px] lg:h-[234px] lg:rounded-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden rounded-[20px] bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.65)_100%)] sm:block lg:rounded-2xl"
        />
        <div className="mt-4 flex flex-col gap-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:mt-0 sm:p-6">
          <h2
            id={`${ids}-title`}
            className="text-xl font-bold leading-[1.4] break-words text-[#1e2433] sm:text-2xl sm:text-white"
          >
            <bdi>{title}</bdi>
          </h2>
          <ul
            aria-label={t('summary')}
            className="flex flex-wrap gap-x-3.5 gap-y-2 text-sm font-medium text-[#64748b] sm:text-white"
          >
            <HeroMeta icon={CalendarDays}>
              <ScholarshipDeadline card={details} now={now} />
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

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,449px)] lg:gap-6">
        {/* Apply and save: right after the title in reading order (mobile and tablet
            Figma); at lg it moves to the inline-end column. */}
        <section
          aria-label={t('fields.apply')}
          className={`${cardClasses} flex flex-col gap-2 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1`}
        >
          {applyWeb ? (
            <SafeLink
              href={applyWeb.href}
              external={applyWeb.external}
              className={`flex h-[52px] items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-base font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] ${ctaFocusRing}`}
            >
              {t('applyNow')}
              {applyWeb.external ? (
                <ExternalLink aria-hidden className="size-4 rtl:-scale-x-100" />
              ) : null}
            </SafeLink>
          ) : null}
          <ScholarshipBookmark card={details} variant="details" />
          {contacts.length > 0 ? (
            <dl className="mt-2 flex flex-col gap-2 border-t border-[#f1f5f9] pt-3 text-sm">
              {contacts.map((link) => (
                <div
                  key={link.href}
                  className="flex flex-wrap items-center justify-between gap-x-3"
                >
                  <dt className="text-[#64748b]">{contactLabel(link)}</dt>
                  <dd className="min-w-0">
                    <SafeLink
                      href={link.href}
                      external={false}
                      dir="ltr"
                      className={`break-all text-[#274383] underline underline-offset-2 hover:text-orange-500 ${focusRing}`}
                    >
                      {link.text}
                    </SafeLink>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        <div className="flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-start-1 lg:gap-6">
          <section
            aria-labelledby={`${ids}-about`}
            className={`${cardClasses} flex flex-col gap-4`}
          >
            <h3 id={`${ids}-about`} className={headingClasses}>
              {t('sections.about')}
            </h3>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.field} className="flex min-w-0 flex-col gap-1">
                  <dt className="text-xs leading-5 text-[#64748b]">{t(`fields.${fact.field}`)}</dt>
                  <dd className="text-sm leading-6 break-words text-[#434343]">
                    {factValue(fact)}
                  </dd>
                </div>
              ))}
              {majors ? (
                <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
                  <dt className="text-xs leading-5 text-[#64748b]">{t('fields.majors')}</dt>
                  <dd>
                    <ul className="flex flex-wrap gap-2">
                      {majors.items.map((major, index) => (
                        <li
                          key={`${index}-${major}`}
                          className="rounded-full bg-[#f8fafc] px-3 py-1 text-sm text-[#434343]"
                        >
                          <bdi>{major}</bdi>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {eligibility ? (
            <ListSection id={`${ids}-eligibility`} title={t('fields.eligibilityCriteria')}>
              <ul className="flex flex-col gap-3">
                {eligibility.items.map((item, index) => (
                  <li
                    key={`${index}-${item}`}
                    className="flex items-start gap-2 text-sm leading-6 text-[#434343]"
                  >
                    <CircleCheck aria-hidden className="mt-1 size-4 shrink-0 text-[#16c172]" />
                    <bdi className="min-w-0 break-words">{item}</bdi>
                  </li>
                ))}
              </ul>
            </ListSection>
          ) : null}

          {documents ? (
            <ListSection id={`${ids}-documents`} title={t('fields.requiredDocuments')}>
              <ol className="flex flex-col gap-3">
                {documents.items.map((item, index) => (
                  <li
                    key={`${index}-${item}`}
                    className="flex items-start gap-3 text-sm leading-6 text-[#434343]"
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
            </ListSection>
          ) : null}
        </div>
      </div>
    </article>
  );
}
