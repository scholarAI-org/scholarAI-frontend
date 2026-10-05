'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { toScholarshipCard } from '@/features/student/scholarship-discovery/adapters/scholarship';
import { ScholarshipBookmark } from '@/features/student/scholarship-discovery/components/ScholarshipBookmark';
import { ScholarshipDeadline } from '@/features/student/scholarship-discovery/components/ScholarshipDeadline';
import { ScholarshipGridCard } from '@/features/student/scholarship-discovery/components/ScholarshipGridCard';
import { useSavedScholarshipsQuery } from '../hooks/useSavedScholarshipsQuery';
import { SavedScholarshipsEmpty } from './SavedScholarshipsEmpty';
import { SavedScholarshipsErrorState } from './SavedScholarshipsErrorState';
import { SavedScholarshipsHeader } from './SavedScholarshipsHeader';
import { SavedScholarshipsLoading } from './SavedScholarshipsLoading';

// Composes the saved page under the existing Student Shell (mounted by the
// student layout). `cards.length` is the single source of truth for both the
// count and the empty-vs-populated branch; loading and error are never
// rendered as "zero".
export function SavedScholarshipsPage() {
  const query = useSavedScholarshipsQuery();
  const locale = useLocale();
  // One "today" per mounted page so all deadlines agree.
  const [now] = useState(() => new Date());

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <SavedScholarshipsHeader count={null} />
        <SavedScholarshipsLoading />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <SavedScholarshipsHeader count={null} />
        <SavedScholarshipsErrorState error={query.error} onRetry={() => query.refetch()} />
      </div>
    );
  }

  const cards = query.data ?? [];
  if (cards.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <SavedScholarshipsHeader count={0} />
        <SavedScholarshipsEmpty />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <SavedScholarshipsHeader count={cards.length} />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="saved-grid">
        {cards.map((item) => {
          const card = toScholarshipCard(item, locale);
          return (
            <li key={card.id}>
              <ScholarshipGridCard
                card={card}
                bookmarkSlot={<ScholarshipBookmark card={card} variant="overlay" />}
                footer={<ScholarshipDeadline card={card} now={now} />}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
