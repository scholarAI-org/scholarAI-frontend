import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { Reveal } from '@/components/shared/Reveal';
import { SectionHeading } from './SectionHeading';
import { ScholarshipCard } from './ScholarshipCard';
import { LeftArrowIcon } from '@/components/icons';

interface ScholarshipItem {
  fundingLabel: string;
  title: string;
  institution: string;
  deadline: string;
}

export function FeaturedScholarships() {
  const t = useTranslations('Landing.featured');
  const items = t.raw('items') as ScholarshipItem[];

  return (
    <section className="bg-[var(--color-bg-page)] py-16 sm:py-20">
      <Container className="flex flex-col gap-8">
        <Reveal>
          <SectionHeading badge={t('badge')} heading={t('heading')} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.title + index} delay={index * 0.05}>
              <ScholarshipCard
                fundingLabel={item.fundingLabel}
                title={item.title}
                institution={item.institution}
                deadline={item.deadline}
                ctaLabel={t('cta')}
              />
            </Reveal>
          ))}
        </div>

        <Reveal className="flex justify-center">
          <a
            href="#"
            className="group flex items-center gap-2 rounded-xl px-4 py-4 text-sm font-bold text-[var(--color-navy-800)] transition-colors hover:text-[var(--color-primary)]"
          >
            {t('browseAll')}
            <LeftArrowIcon className="h-6 w-6 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
