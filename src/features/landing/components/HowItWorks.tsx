import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { SectionHeading } from './SectionHeading';

export function HowItWorks() {
  const t = useTranslations('Landing.updated.steps');
  const steps = t.raw('items') as { title: string; description: string }[];
  return (
    <section id="how-it-works" className="landing-steps">
      <Container>
        <SectionHeading badge={t('badge')} heading={t('heading')} />
        <ol>
          {steps.map((step, i) => (
            <li key={step.title} data-landing-reveal={i}>
              <span className={`step-number step-number-${i}`}>{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
