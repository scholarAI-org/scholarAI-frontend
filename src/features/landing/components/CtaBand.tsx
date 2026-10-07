import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/shared/Container';
import { buttonStyles } from '@/components/ui/Button';
import { DesignAsset } from './DesignAsset';

export function CtaBand() {
  const t = useTranslations('Landing.updated.cta');
  const hero = useTranslations('Landing.updated.hero');
  const bullets = t.raw('bullets') as string[];
  return (
    <section className="landing-cta">
      <Container>
        <div className="cta-inner" data-landing-reveal="0">
          <div className="cta-copy">
            <span>{t('badge')}</span>
            <h2>
              {t('heading')}
              <br />
              {t('headingEnd')}
            </h2>
            <p>{t('description')}</p>
            <ul>
              {bullets.map((bullet) => (
                <li key={bullet}>
                  <span>
                    <DesignAsset name="2100-736-imgCheckIcon" />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="cta-actions">
              <Link
                href="/register"
                className={buttonStyles({ variant: 'landing', className: 'cta-register' })}
              >
                {t('start')}
              </Link>
              <Link
                href="/login"
                className={buttonStyles({ variant: 'landingOutline', className: 'cta-login' })}
              >
                {t('login')}
              </Link>
            </div>
          </div>
          <div className="cta-image">
            <DesignAsset
              name="2100-736-imgGeminiGeneratedImageHkn13Ehkn13Ehkn11"
              alt={hero('imageAlt')}
            />
            <div />
          </div>
        </div>
      </Container>
    </section>
  );
}
