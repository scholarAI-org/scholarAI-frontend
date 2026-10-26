'use client';

import { ExternalLink, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { toScholarshipCard } from '@/features/student/scholarship-discovery/adapters/scholarship';
import { getScholarshipDetailsHref } from '@/features/student/scholarship-discovery/lib/details-link';
import { buildTrackingMeta, joinMeta, trackingMetaParts } from '../lib/presentation';
import type { TrackedItem, TrackingStatus } from '../types';
import { TrackingNote } from './TrackingNote';
import { TrackingStatusSelect } from './TrackingStatusSelect';

interface TrackingCardProps {
  item: TrackedItem;
  detailsEnabled: boolean;
  onChangeStatus: (item: TrackedItem, status: TrackingStatus) => void;
  onSaveNote: (item: TrackedItem, notes: string) => Promise<unknown>;
  onRequestRemove: (item: TrackedItem) => void;
}

const iconButton =
  'flex size-10 shrink-0 items-center justify-center rounded-full text-[#979797] transition-colors hover:bg-[#f8fafc] hover:text-[#434343] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:size-8';

// Figma ScholarshipCard-1 (2415:6307): title and meta line at the start, then
// delete, official link, scholarship pill and status select, then the note.
export function TrackingCard({
  item,
  detailsEnabled,
  onChangeStatus,
  onSaveNote,
  onRequestRemove,
}: TrackingCardProps) {
  const t = useTranslations('StudentTracking');
  const locale = useLocale();
  const card = toScholarshipCard(item.scholarship, locale);
  const title = card.title ?? t('card.untitled');
  const detailsHref = getScholarshipDetailsHref(item.scholarship.id, detailsEnabled);
  const meta = trackingMetaParts(buildTrackingMeta(item.scholarship, item.updatedAt));
  const metaLine = joinMeta(
    meta.map((part) =>
      part.kind === 'organization'
        ? part.value
        : part.kind === 'noDeadline'
          ? t('card.meta.noDeadline')
          : t(`card.meta.${part.kind}`, { date: part.value })
    )
  );

  return (
    <article
      className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_8px_8px_0px_rgba(0,0,0,0.03)] sm:p-6"
      data-testid="tracking-card"
      data-tracking-id={item.id}
      data-status={item.status}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h2
            className="text-lg font-bold break-words text-[rgba(30,27,51,0.7)]"
            data-testid="tracking-card-title"
          >
            {title}
          </h2>
          {metaLine ? (
            <p className="text-xs leading-5 break-words text-[#979797]" data-testid="tracking-meta">
              {metaLine}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TrackingStatusSelect
            value={item.status}
            title={title}
            onChange={(status) => onChangeStatus(item, status)}
          />
          {detailsHref ? (
            <Link
              href={detailsHref}
              aria-label={t('card.scholarshipLinkLabel', { title })}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#f97316] px-3 text-xs text-white hover:bg-[#ea580c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
              data-testid="tracking-scholarship-link"
            >
              {t('card.scholarshipLink')}
            </Link>
          ) : null}
          {item.officialUrl ? (
            <a
              href={item.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('card.officialLinkLabel', { title })}
              className={iconButton}
              data-testid="tracking-official-link"
            >
              <ExternalLink aria-hidden className="size-4" />
              <span className="sr-only">{t('card.newTab')}</span>
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onRequestRemove(item)}
            aria-label={t('card.removeLabel', { title })}
            className={iconButton}
            data-testid="tracking-remove"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      </div>
      <TrackingNote notes={item.notes} title={title} onSave={(notes) => onSaveNote(item, notes)} />
    </article>
  );
}
