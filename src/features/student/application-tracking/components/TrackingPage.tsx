'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { toScholarshipCard } from '@/features/student/scholarship-discovery/adapters/scholarship';
import { useSavedScholarshipsQuery } from '@/features/student/saved-scholarships/hooks/useSavedScholarshipsQuery';
import { countByStatus } from '../lib/counts';
import { classifyTrackingError, TrackingContractError } from '../lib/errors';
import { getListView, getSectionState } from '../lib/view-state';
import { useTrackedQuery } from '../hooks/useTrackedQuery';
import {
  useRemoveTracking,
  useSaveTrackingNote,
  useUpdateTrackingStatus,
} from '../hooks/useTrackingMutations';
import type { TrackedItem, TrackingStatus } from '../types';
import { ConfirmRemoveDialog } from './ConfirmRemoveDialog';
import { TrackingCard } from './TrackingCard';
import { TrackingStatusCards } from './TrackingStatusCards';
import { TrackingEmpty, TrackingErrorState, TrackingLoading } from './TrackingStates';

type NoticeKey = 'card.statusFailed' | 'card.gone' | 'remove.failed';

// A 404 on a row action means the row is gone (it was already dropped from the
// list); any other failure was rolled back.
const noticeFor = (error: unknown, failed: NoticeKey): NoticeKey =>
  classifyTrackingError(error) === 'not-found' ? 'card.gone' : failed;

// Composes the page under the Student Shell (mounted by the student layout).
// Two independent sections: the status cards and the list read the tracked list,
// and the `saved` card reads the saved list. One failing never blanks the other.
export function TrackingPage({ detailsEnabled }: { detailsEnabled: boolean }) {
  const t = useTranslations('StudentTracking');
  const locale = useLocale();
  const tracked = useTrackedQuery();
  const saved = useSavedScholarshipsQuery();
  const updateStatus = useUpdateTrackingStatus();
  const saveNote = useSaveTrackingNote();
  const remove = useRemoveTracking();
  const [removing, setRemoving] = useState<TrackedItem | null>(null);
  const [notice, setNotice] = useState<NoticeKey | null>(null);

  const trackedState = getSectionState(tracked);
  const savedState = getSectionState(saved);
  const view = getListView(trackedState, tracked.data);
  const items = tracked.data?.items ?? [];
  const skipped = tracked.data?.skipped ?? 0;

  function changeStatus(item: TrackedItem, status: TrackingStatus) {
    if (status === item.status) return;
    setNotice(null);
    updateStatus
      .mutateAsync({ trackingId: item.id, status })
      .catch((error: unknown) => setNotice(noticeFor(error, 'card.statusFailed')));
  }

  // Rejects so the note box keeps the draft and shows its own error.
  function saveItemNote(item: TrackedItem, notes: string) {
    setNotice(null);
    return saveNote.mutateAsync({ trackingId: item.id, notes }).catch((error: unknown) => {
      if (classifyTrackingError(error) === 'not-found') setNotice('card.gone');
      throw error;
    });
  }

  // Optimistic: the dialog closes and the row leaves at once. A failure restores
  // the row in place and shows the notice.
  function confirmRemove() {
    if (!removing) return;
    const target = removing;
    setRemoving(null);
    setNotice(null);
    remove
      .mutateAsync({ trackingId: target.id })
      .catch((error: unknown) => setNotice(noticeFor(error, 'remove.failed')));
  }

  return (
    <div className="flex flex-col gap-6" data-testid="tracking-page">
      <TrackingStatusCards
        counts={trackedState === 'ready' ? countByStatus(items) : null}
        trackedState={trackedState}
        savedCount={savedState === 'ready' ? (saved.data?.length ?? 0) : null}
        savedState={savedState}
      />

      {notice ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[var(--color-text-error)]"
          data-testid="tracking-notice"
          data-notice={notice}
        >
          <span>{t(notice)}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label={t('page.dismiss')}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#979797] hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : null}

      <section aria-label={t('page.sectionLabel')} className="flex flex-col gap-7">
        {view === 'loading' ? <TrackingLoading /> : null}
        {view === 'error' ? (
          <TrackingErrorState
            error={tracked.error ?? new TrackingContractError('bad-response')}
            onRetry={() => tracked.refetch()}
          />
        ) : null}
        {view === 'empty' ? <TrackingEmpty /> : null}
        {view === 'list' ? (
          <>
            {tracked.isRefetchError ? (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#434343]"
                data-testid="tracking-refresh-failed"
              >
                <span>{t('errors.refresh')}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => tracked.refetch()}
                >
                  {t('errors.retry')}
                </Button>
              </div>
            ) : null}
            {skipped > 0 ? (
              <p role="status" className="text-sm text-[#979797]" data-testid="tracking-skipped">
                {t('page.skipped', { count: skipped })}
              </p>
            ) : null}
            <div className="flex flex-col gap-7" data-testid="tracking-list">
              {items.map((item) => (
                <TrackingCard
                  key={item.id}
                  item={item}
                  detailsEnabled={detailsEnabled}
                  onChangeStatus={changeStatus}
                  onSaveNote={saveItemNote}
                  onRequestRemove={(target) => {
                    setNotice(null);
                    setRemoving(target);
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <ConfirmRemoveDialog
        title={
          removing
            ? (toScholarshipCard(removing.scholarship, locale).title ?? t('card.untitled'))
            : null
        }
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
