import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { SectionHeading } from './SectionHeading';
import { DesignAsset } from './DesignAsset';

const ICONS = [
  '2009-360-imgSearch1',
  '2009-360-imgDocumentAlignLeft11',
  '2009-360-imgChart',
] as const;
export function PlatformOverview() {
  const t = useTranslations('Landing.updated.overview');
  const items = t.raw('items') as { title: string; description: string }[];
  return (
    <section id="about" className="landing-overview">
      <Container>
        <SectionHeading badge={t('badge')} heading={t('heading')} subtitle={t('subtitle')} />
        <div className="landing-overview-grid">
          {items.map((item, i) => (
            <article key={item.title} data-landing-reveal={i}>
              <div className={`overview-icon overview-icon-${i}`}>
                <DesignAsset name={ICONS[i]} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
