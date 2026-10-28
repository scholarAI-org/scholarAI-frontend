'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScholarshipBookmark } from '@/features/student/scholarship-discovery/components/ScholarshipBookmark';
import type { ScholarshipDetailsViewModel } from '../types';
import { SafeLink, cardClasses, ctaFocusRing, focusRing } from './DetailsParts';

const isExternal = (href: string) => /^https?:/i.test(href);

// Apply and save, plus the application email and phone when the scholarship
// has them (Figma 2481:4537, top of the side column). Each part is optional.
export function DetailsActions({ details }: { details: ScholarshipDetailsViewModel }) {
  const t = useTranslations('StudentScholarshipDetails');
  const { link, email, phone } = details.apply;
  const contacts = [
    email
      ? { href: email, text: details.applyText.email ?? email, label: t('fields.applyEmail') }
      : null,
    phone
      ? { href: phone, text: details.applyText.phone ?? phone, label: t('fields.applyPhone') }
      : null,
  ].flatMap((contact) => contact ?? []);

  return (
    <section aria-label={t('fields.apply')} className={`${cardClasses} flex flex-col gap-2`}>
      {link ? (
        <SafeLink
          href={link}
          external={isExternal(link)}
          className={`flex h-[52px] items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-base font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] ${ctaFocusRing}`}
        >
          {t('applyNow')}
          {isExternal(link) ? (
            <ExternalLink aria-hidden className="size-4 [&:dir(rtl)]:-scale-x-100" />
          ) : null}
        </SafeLink>
      ) : null}
      <ScholarshipBookmark
        card={{
          id: details.id,
          title: details.title,
          noDeadline: details.noDeadline,
          isSaved: details.isSaved,
        }}
        variant="details"
      />
      {contacts.length > 0 ? (
        <dl className="mt-2 flex flex-col gap-2 border-t border-[#f1f5f9] pt-3 text-sm">
          {contacts.map((contact) => (
            <div key={contact.href} className="flex flex-wrap items-center justify-between gap-x-3">
              <dt className="text-[#64748b]">{contact.label}</dt>
              <dd className="min-w-0">
                <SafeLink
                  href={contact.href}
                  external={false}
                  dir="ltr"
                  className={`break-all text-[#274383] underline underline-offset-2 hover:text-orange-500 ${focusRing}`}
                >
                  {contact.text}
                </SafeLink>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
