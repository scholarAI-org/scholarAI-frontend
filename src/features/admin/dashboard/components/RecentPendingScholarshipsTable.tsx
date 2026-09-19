'use client';

import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  formatDashboardDateTime,
  getDeadlinePresentation,
  getDisplayableDashboardText,
  getSafeExternalUrl,
  getSourceDomain,
} from '../lib/formatters';
import type { RecentPendingScholarship } from '../types';

type RecentPendingScholarshipsTableProps = {
  items: RecentPendingScholarship[];
};

function SourceLink({ item }: { item: RecentPendingScholarship }) {
  const t = useTranslations('AdminDashboard');
  const url = getSafeExternalUrl(item.source_url);
  const source = getSourceDomain(item.source_url) ?? getDisplayableDashboardText(item.source);

  if (!source) {
    return <span className="text-[#979797]">{t('states.unavailable')}</span>;
  }

  if (!url) {
    return <span>{source}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('actions.openSource')}: ${source}`}
      className="inline-flex items-center gap-1 text-[#274383] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
    >
      <span>{source}</span>
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function DeadlineValue({ item }: { item: RecentPendingScholarship }) {
  const locale = useLocale();
  const t = useTranslations('AdminDashboard');
  const presentation = getDeadlinePresentation(item.deadline, item.no_deadline, locale);

  if (presentation.kind === 'date') {
    return <time dateTime={item.deadline ?? undefined}>{presentation.value}</time>;
  }

  return (
    <span className="text-[#979797]">
      {t(`states.${presentation.kind === 'no-deadline' ? 'noDeadline' : 'unavailable'}`)}
    </span>
  );
}

function ScholarshipStatus({ status }: { status: string }) {
  const t = useTranslations('AdminDashboard');
  const displayStatus = getDisplayableDashboardText(status) ?? t('states.unknownStatus');

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[#434343]">
      <span className="size-2 rounded-full bg-[#f59e0b]" aria-hidden="true" />
      {displayStatus}
    </span>
  );
}

function ScrapedAt({ value }: { value: string | null }) {
  const locale = useLocale();
  const t = useTranslations('AdminDashboard');
  const formatted = formatDashboardDateTime(value, locale);

  return formatted ? (
    <time dateTime={value ?? undefined}>{formatted}</time>
  ) : (
    <span className="text-[#979797]">{t('states.unavailable')}</span>
  );
}

export function RecentPendingScholarshipsTable({ items }: RecentPendingScholarshipsTableProps) {
  const t = useTranslations('AdminDashboard');

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-start text-sm">
          <thead className="bg-[#f8fafc] text-[#635f80]">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t('fields.scholarship')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t('fields.organization')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t('fields.country')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t('fields.source')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t('fields.deadline')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t('fields.status')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t('fields.scrapedAt')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] text-[#434343]">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4 font-medium">
                  {getDisplayableDashboardText(item.title) ?? t('states.unavailable')}
                </td>
                <td className="px-4 py-4">
                  {getDisplayableDashboardText(item.organization_name) ?? t('states.unavailable')}
                </td>
                <td className="px-4 py-4">
                  {getDisplayableDashboardText(item.country) ?? t('states.unavailable')}
                </td>
                <td className="px-4 py-4">
                  <SourceLink item={item} />
                </td>
                <td className="px-4 py-4">
                  <DeadlineValue item={item} />
                </td>
                <td className="px-4 py-4">
                  <ScholarshipStatus status={item.status} />
                </td>
                <td className="px-4 py-4">
                  <ScrapedAt value={item.scraped_at} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-[#e2e8f0] md:hidden">
        {items.map((item) => (
          <li key={item.id} className="p-4">
            <article className="space-y-3">
              <h3 className="font-semibold text-[#434343]">
                {getDisplayableDashboardText(item.title) ?? t('states.unavailable')}
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-[#979797]">{t('fields.organization')}</dt>
                  <dd className="mt-1 text-[#434343]">
                    {getDisplayableDashboardText(item.organization_name) ?? t('states.unavailable')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#979797]">{t('fields.country')}</dt>
                  <dd className="mt-1 text-[#434343]">
                    {getDisplayableDashboardText(item.country) ?? t('states.unavailable')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#979797]">{t('fields.deadline')}</dt>
                  <dd className="mt-1 text-[#434343]">
                    <DeadlineValue item={item} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[#979797]">{t('fields.source')}</dt>
                  <dd className="mt-1 text-[#434343]">
                    <SourceLink item={item} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[#979797]">{t('fields.status')}</dt>
                  <dd className="mt-1">
                    <ScholarshipStatus status={item.status} />
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#979797]">{t('fields.scrapedAt')}</dt>
                  <dd className="mt-1 text-[#434343]">
                    <ScrapedAt value={item.scraped_at} />
                  </dd>
                </div>
              </dl>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
