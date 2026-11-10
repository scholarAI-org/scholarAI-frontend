'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import {
  formatCardFieldLabel,
  type CardFieldLabel,
} from '@/features/student/scholarship-discovery/lib/card-labels';
import { toFormattingLocale } from '@/i18n/formatting';
import {
  formatCalendarDate,
  parseCalendarDate,
} from '@/features/student/scholarship-discovery/lib/deadlines';

// Shared pieces of the details page. Layout uses logical properties only: the
// root <html> is always dir="rtl", so Tailwind's rtl: variant cannot be trusted.

export const cardClasses = 'rounded-[18px] border border-gray-300 bg-white p-4 sm:p-5';
export const headingClasses = 'text-lg font-bold leading-7 text-black';
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500';
// The orange apply button takes the navy ring so focus stays visible on it.
export const ctaFocusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#274383]';
export const linkClasses = `break-words text-[#274383] underline underline-offset-2 hover:text-orange-500 ${focusRing}`;

// Translated label for a card field (study level, funding): a known code shows
// its translation, anything else is shown exactly as received.
export function useFieldText() {
  const t = useTranslations('StudentScholarshipDiscovery');
  const locale = useLocale();
  return (label: CardFieldLabel) => formatCardFieldLabel(label, (key) => t(key), locale);
}

// A calendar date (YYYY-MM-DD) or an instant, in the page language.
export function useDateText() {
  const locale = useLocale();
  return {
    calendar: (value: string) => {
      const date = parseCalendarDate(value);
      return date ? formatCalendarDate(date, locale) : value;
    },
    instant: (value: Date) =>
      new Intl.DateTimeFormat(toFormattingLocale(locale), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(value),
  };
}

export function NewTabHint() {
  const t = useTranslations('StudentScholarshipDetails');
  return <span className="sr-only"> {t('opensInNewTab')}</span>;
}

// External links open in a new tab without access to this page.
export function SafeLink({
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

// One titled card of the page; the heading names the region for screen readers.
export function DetailsCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`${cardClasses} flex flex-col gap-4`}>
      <h3 id={id} className={headingClasses}>
        {title}
      </h3>
      {children}
    </section>
  );
}

// A label and its value in the light tile used by the Figma "about" grid.
export function FactTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-[#f8fafc] px-4 py-3">
      <dt className="text-xs leading-5 text-[#64748b]">{label}</dt>
      <dd className="text-sm leading-6 break-words text-[#434343]">{children}</dd>
    </div>
  );
}
