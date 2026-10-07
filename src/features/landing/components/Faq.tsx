'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
export function Faq() {
  const t = useTranslations('Landing.faq');
  const items = t.raw('items') as { q: string; a: string }[];
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-[var(--color-bg-page)] py-16 sm:py-20">
      <Container className="max-w-[960px]">
        <div className="mb-9 text-center">
          <p className="text-sm font-bold text-[var(--color-primary)]">{t('badge')}</p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--color-navy-800)]">{t('heading')}</h2>
        </div>
        {items.map((item, i) => (
          <div key={item.q} className="border-b border-[var(--color-border-default)]">
            <button
              type="button"
              aria-expanded={open === i}
              aria-controls={`faq-panel-${i}`}
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-start font-bold text-[var(--color-navy-800)]"
            >
              <span>{item.q}</span>
              <ChevronDown
                className={open === i ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
            </button>
            {open === i && (
              <p
                id={`faq-panel-${i}`}
                className="pb-5 text-sm leading-6 text-[var(--color-text-secondary)]"
              >
                {item.a}
              </p>
            )}
          </div>
        ))}
      </Container>
    </section>
  );
}
