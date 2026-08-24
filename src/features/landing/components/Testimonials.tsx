import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { Reveal } from '@/components/shared/Reveal';
import { SectionHeading } from './SectionHeading';
import { TestimonialCard, type TestimonialCardData } from './TestimonialCard';

export function Testimonials() {
  const t = useTranslations('Landing.testimonials');
  const items = t.raw('items') as TestimonialCardData[];

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <Reveal>
          <SectionHeading badge={t('badge')} heading={t('heading')} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.name} delay={index * 0.08}>
              <TestimonialCard {...item} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
