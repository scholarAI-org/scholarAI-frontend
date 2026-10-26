'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toScholarshipCard } from '@/features/student/scholarship-discovery/adapters/scholarship';
import { useSavedScholarshipsQuery } from '@/features/student/saved-scholarships/hooks/useSavedScholarshipsQuery';
import { countByStatus } from '../lib/counts';
import { useTrackedQuery } from '../hooks/useTrackedQuery';
import {
  useRemoveTracking,
  useSaveTrackingNote,
  useUpdateTrackingStatus,
} from '../hooks/useTrackingMutations';
import type { TrackedItem, TrackingStatus } from '../types';
import { ConfirmRemoveDialog } from './ConfirmRemoveDialog';
import { TrackingCard } from './TrackingCard';
import { TrackingStatusCards, type SectionState } from './TrackingStatusCards';
import { TrackingEmpty, TrackingErrorState, TrackingLoading } from './TrackingStates';

const sectionState = (query: { isPending: boolean; isError: boolean }): SectionState =>
  query.isPending ? 'loading' : query.isError ? 'error' : 'ready';

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

  const items = tracked.data?.items ?? [];
  const trackedState = sectionState(tracked);
  const savedState = sectionState(saved);

  function confirmRemove() {
    if (!removing) return;
    remove.mutate(
      { trackingId: removing.id },
      {
        onSuccess: () => setRemoving(null),
      }
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="tracking-page">
      <TrackingStatusCards
        counts={trackedState === 'ready' ? countByStatus(items) : null}
        trackedState={trackedState}
        savedCount={savedState === 'ready' ? (saved.data?.length ?? 0) : null}
        savedState={savedState}
      />

      <section aria-label={t('page.sectionLabel')} className="flex flex-col gap-7">
        {trackedState === 'loading' ? <TrackingLoading /> : null}
        {trackedState === 'error' ? (
          <TrackingErrorState error={tracked.error} onRetry={() => tracked.refetch()} />
        ) : null}
        {trackedState === 'ready' && items.length === 0 ? <TrackingEmpty /> : null}
        {trackedState === 'ready' && items.length > 0 ? (
          <div className="flex flex-col gap-7" data-testid="tracking-list">
            {items.map((item) => (
              <TrackingCard
                key={item.id}
                item={item}
                detailsEnabled={detailsEnabled}
                onChangeStatus={(target: TrackedItem, status: TrackingStatus) =>
                  updateStatus.mutate({ trackingId: target.id, status })
                }
                onSaveNote={(target, notes) =>
                  saveNote.mutateAsync({ trackingId: target.id, notes })
                }
                onRequestRemove={(target) => {
                  remove.reset();
                  setRemoving(target);
                }}
              />
            ))}
          </div>
        ) : null}
      </section>

      <ConfirmRemoveDialog
        title={
          removing
            ? (toScholarshipCard(removing.scholarship, locale).title ?? t('card.untitled'))
            : null
        }
        pending={remove.isPending}
        failed={remove.isError}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
