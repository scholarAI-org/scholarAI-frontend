import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { SectionHeading } from './SectionHeading';
import { FeatureCard } from './FeatureCard';

const ICONS = [
  '2054-2795-imgIcon2',
  '2054-2795-imgIcon1',
  '2054-2795-imgIcon',
  '2054-2795-imgIcon5',
  '2054-2795-imgIcon4',
  '2054-2795-imgIcon3',
  '2054-2795-imgIcon8',
  '2054-2795-imgIcon7',
  '2054-2795-imgIcon6',
] as const;
const TONES = [
  '#e2e8f0',
  '#f1f1fb',
  '#fff7ed',
  '#f1f1fb',
  '#fef2f2',
  '#f0fdf4',
  '#e2e8f0',
  '#fffbeb',
  '#f1f1fb',
];
export function AiFeatures() {
  const t = useTranslations('Landing.updated.features');
  const items = t.raw('items') as { title: string; description: string }[];
  return (
    <section id="features" className="landing-features">
      <Container>
        <SectionHeading badge={t('badge')} heading={t('heading')} />
        <div className="landing-features-grid">
          {items.map((item, i) => (
            <FeatureCard key={item.title} {...item} icon={ICONS[i]} tone={TONES[i]} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
