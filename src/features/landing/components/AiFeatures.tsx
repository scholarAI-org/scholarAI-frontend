import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { Reveal } from '@/components/shared/Reveal';
import { SectionHeading } from './SectionHeading';
import { FeatureCard } from './FeatureCard';
import { BrainIcon, DocumentIcon, NotificationIcon } from '@/components/icons';

export function AiFeatures() {
  const t = useTranslations('Landing.aiFeatures');

  const cards = [
    { key: 'matching', icon: BrainIcon },
    { key: 'documents', icon: DocumentIcon },
    { key: 'reminders', icon: NotificationIcon },
  ] as const;

  return (
    <section id="features" className="bg-[var(--color-bg-page)] py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <Reveal>
          <SectionHeading badge={t('badge')} heading={t('heading')} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <Reveal key={card.key} delay={index * 0.08}>
              <FeatureCard
                title={t(`cards.${card.key}.title`)}
                description={t(`cards.${card.key}.description`)}
                icon={card.icon}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
