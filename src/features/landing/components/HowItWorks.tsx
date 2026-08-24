import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { Reveal } from '@/components/shared/Reveal';
import { SectionHeading } from './SectionHeading';

interface StepItem {
  number: string;
  title: string;
  description: string;
}

export function HowItWorks() {
  const t = useTranslations('Landing.howItWorks');
  const steps = t.raw('steps') as StepItem[];

  return (
    <section id="how-it-works" className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <Reveal>
          <SectionHeading badge={t('badge')} heading={t('heading')} />
        </Reveal>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08} className="flex flex-col gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-green-600)]">
                <span className="text-2xl font-bold text-white">{step.number}</span>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-bold text-black">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-gray-500)]">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
