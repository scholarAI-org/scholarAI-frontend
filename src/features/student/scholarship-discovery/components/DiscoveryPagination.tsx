'use client';

import { useTranslations } from 'next-intl';
import { getPageWindow } from '../lib/pagination';

interface DiscoveryPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const pill =
  'flex h-10 items-center justify-center rounded-full border border-gray-300 bg-white text-xs text-gray-500 transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white';

// Figma pagination (2264:3420): Previous, a bounded page window, Next. Values come
// from the server response; changes go through push-mode URL updates.
export function DiscoveryPagination({ page, totalPages, onChange }: DiscoveryPaginationProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={t('pagination.label')} className="flex justify-center p-4">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            className={`${pill} min-w-[70px] px-4`}
          >
            {t('pagination.previous')}
          </button>
        </li>
        {getPageWindow(page, totalPages).map((item) =>
          item.type === 'ellipsis' ? (
            <li
              key={`ellipsis-${item.key}`}
              aria-hidden
              className="flex w-6 justify-center text-xs text-gray-500"
            >
              …
            </li>
          ) : (
            <li key={item.page}>
              {item.page === page ? (
                <button
                  type="button"
                  aria-current="page"
                  aria-label={t('pagination.currentPage', { page: item.page })}
                  className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-xs text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#274383]"
                >
                  {item.page}
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={t('pagination.page', { page: item.page })}
                  onClick={() => onChange(item.page)}
                  className={`${pill} size-10`}
                >
                  {item.page}
                </button>
              )}
            </li>
          )
        )}
        <li>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onChange(page + 1)}
            className={`${pill} min-w-[70px] px-4`}
          >
            {t('pagination.next')}
          </button>
        </li>
      </ul>
    </nav>
  );
}
