'use client';

import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { DemoDataBadge } from './DemoDataBadge';
import { Skeleton } from './Skeleton';

export type StatView = (
  | { state: 'loading' }
  | { state: 'error'; onRetry: () => void }
  // `href`: set only when the destination exists and is enabled.
  | { state: 'ready'; value: number; href?: string | null }
) & {
  // True when the number comes from demo data (local development only).
  demo?: boolean;
};

export type StatId = 'notifications' | 'saved' | 'inProgress' | 'upcoming';

interface StatCardProps {
  id: StatId;
  label: string;
  icon: LucideIcon;
  chipClassName: string;
  view: StatView;
}

const CARD =
  'flex h-full flex-col gap-3 rounded-2xl border border-gray-300 bg-white p-4 sm:p-[17px]';
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500';

// Figma 2353:5412: number at the start, icon chip at the end, label below.
export function StatCard({ id, label, icon: Icon, chipClassName, view }: StatCardProps) {
  const t = useTranslations('StudentHome');

  const top = (
    <div className="flex items-center justify-between gap-3">
      {view.state === 'ready' ? (
        <span className="text-[28px] leading-9 font-bold text-[#274383]">{view.value}</span>
      ) : view.state === 'loading' ? (
        <Skeleton kind="stat" className="h-7 w-10" />
      ) : (
        <span aria-hidden className="h-9" />
      )}
      <span
        aria-hidden
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${chipClassName}`}
      >
        <Icon className="size-5" />
      </span>
    </div>
  );

  if (view.state === 'error') {
    return (
      <li data-stat={id} className="min-w-0">
        <div role="alert" className={CARD}>
          {top}
          <p className="text-sm text-[#434343]">{label}</p>
          {view.demo ? <DemoDataBadge /> : null}
          <p className="text-xs text-[var(--color-text-error)]">{t('stats.error')}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-fit rounded-full"
            onClick={view.onRetry}
          >
            {t('states.retry')}
          </Button>
        </div>
      </li>
    );
  }

  const body = (
    <>
      {top}
      <p className="text-sm text-[#434343]">{label}</p>
      {view.demo ? <DemoDataBadge /> : null}
    </>
  );
  return (
    <li data-stat={id} className="min-w-0">
      {view.state === 'ready' && view.href ? (
        <Link href={view.href} className={`${CARD} transition-colors hover:bg-[#f8fafc] ${FOCUS}`}>
          {body}
        </Link>
      ) : (
        <div className={CARD}>{body}</div>
      )}
    </li>
  );
}
