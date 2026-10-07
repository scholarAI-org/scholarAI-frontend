import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/shared/Container';
import { buttonStyles } from '@/components/ui/Button';
import { DesignAsset } from './DesignAsset';

export function FeatureSpotlight({ kind }: { kind: 'matching' | 'documents' }) {
  const t = useTranslations(`Landing.updated.${kind}`);
  const bullets = t.raw('bullets') as string[];
  return (
    <section id={kind} className={`landing-spotlight landing-spotlight-${kind}`}>
      <Container className="spotlight-inner">
        <div className="spotlight-copy" data-landing-reveal="0">
          <span className="spotlight-eyebrow">{t('badge')}</span>
          <h2>{t('heading')}</h2>
          <p>{t('description')}</p>
          <ul>
            {bullets.map((bullet, i) => (
              <li key={bullet}>
                <span>
                  <DesignAsset
                    name={
                      kind === 'matching'
                        ? '2075-494-imgCheck'
                        : (
                            [
                              '2075-608-imgCheck',
                              '2075-608-imgCheck1',
                              '2075-608-imgCheck2',
                              '2075-608-imgCheck3',
                            ] as const
                          )[i]
                    }
                  />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
          <Link
            href="/student/profile"
            className={buttonStyles({
              variant: 'landing',
              className: 'landing-wide spotlight-cta',
            })}
          >
            {t('cta')}
          </Link>
        </div>
        <div className="spotlight-art" data-landing-reveal="1">
          <DesignAsset
            name={kind === 'matching' ? 'ai-match' : '2075-608-imgDocEnhance1'}
            alt={t('imageAlt')}
          />
        </div>
      </Container>
    </section>
  );
}
