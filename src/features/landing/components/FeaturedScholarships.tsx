'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { Link } from '@/i18n/navigation';
import { buttonStyles } from '@/components/ui/Button';
import { SectionHeading } from './SectionHeading';
import { ScholarshipCard, type ScholarshipCardData } from './ScholarshipCard';

const IMAGES = ['2019-1057-imgImage2', '2019-1057-imgImage1', '2019-1057-imgImage'] as const;

export function FeaturedScholarships({ query }: { query: string }) {
  const t = useTranslations('Landing.updated.featured');
  const items = t.raw('items') as Omit<ScholarshipCardData, 'image'>[];
  const visibleItems = items
    .map((item, index) => ({
      ...item,
      image: IMAGES[index],
      imageClass: index === 1 ? 'scholarship-crop' : undefined,
    }))
    .filter((item) =>
      `${item.title} ${item.country} ${item.level} ${t('funding')}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase())
    );
  return (
    <section id="scholarships" className="landing-featured">
      <Container>
        <SectionHeading badge={t('badge')} heading={t('heading')} />
        <div className="landing-scholarships-grid">
          {visibleItems.map((item, index) => (
            <ScholarshipCard key={item.image + index} {...item} index={index} />
          ))}
        </div>
        {visibleItems.length === 0 && (
          <p className="landing-empty" role="status">
            {t('empty')}
          </p>
        )}
        <div className="landing-browse">
          <Link
            href="/login"
            className={buttonStyles({ variant: 'landing', className: 'landing-wide' })}
          >
            {t('browse')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
