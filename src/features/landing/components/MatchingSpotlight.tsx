import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/shared/Container';
import { buttonStyles } from '@/components/ui/Button';
import { DesignAsset } from './DesignAsset';

export function MatchingSpotlight() {
  const t = useTranslations('Landing.updated.matching');
  const bullets = t.raw('bullets') as string[];
  return (
    <section id="matching" className="landing-spotlight landing-spotlight-matching">
      <Container className="spotlight-inner">
        <div className="spotlight-copy" data-landing-reveal="0">
          <span className="spotlight-eyebrow">{t('badge')}</span>
          <h2>{t('heading')}</h2>
          <p>{t('description')}</p>
          <ul>
            {bullets.map((bullet) => (
              <li key={bullet}>
                <span>
                  <DesignAsset name="2075-494-imgCheck" />
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
          <DesignAsset name="ai-match" alt={t('imageAlt')} />
        </div>
      </Container>
    </section>
  );
}
