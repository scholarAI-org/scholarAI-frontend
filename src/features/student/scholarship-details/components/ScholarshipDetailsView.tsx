'use client';

import { useId, useState, type ReactNode } from 'react';
import type { ScholarshipDetailsViewModel } from '../types';
import { DetailsActions } from './DetailsActions';
import { DetailsHero } from './DetailsHero';
import { DetailsSections } from './DetailsSections';
import { DetailsTracking } from './DetailsTracking';

// Layout per Figma 2481:4537 (desktop): the header across the top, then the
// section cards in the main column and the actions in the side column (the
// grid's second column, which sits on the inline-end side in both directions).
// `sideExtras` carries the optional cards that are behind feature flags.
export function ScholarshipDetailsView({
  details,
  sideExtras,
}: {
  details: ScholarshipDetailsViewModel;
  sideExtras?: ReactNode;
}) {
  const titleId = useId();
  // One "today" for every deadline on the page.
  const [now] = useState(() => new Date());

  return (
    <article aria-labelledby={titleId} className="flex flex-col gap-5 lg:gap-6">
      <DetailsHero details={details} titleId={titleId} now={now} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,449px)] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-start-1 lg:gap-6">
          <DetailsActions details={details} />
          <DetailsTracking id={details.id} />
          {sideExtras}
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <DetailsSections details={details} now={now} />
        </div>
      </div>
    </article>
  );
}
