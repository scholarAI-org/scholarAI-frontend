'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { Link } from '@/i18n/navigation';
import { buttonStyles } from '@/components/ui/Button';
import { HeroArtwork } from './HeroArtwork';
import { DesignAsset } from './DesignAsset';

export function Hero({ onSearch }: { onSearch: (query: string) => void }) {
  const t = useTranslations('Landing.updated.hero');
  const filters = t.raw('filters') as string[];
  return (
    <section className="landing-hero">
      <Container className="landing-hero-inner">
        <div className="hero-content">
          <span className="hero-eyebrow">
            <DesignAsset name="2006-354-imgEllipse" />
            {t('badge')}
          </span>
          <h1 data-landing-entrance="0">
            {t('title')}
            <br className="hero-title-break" />
            <span>{t('accent')}</span>
          </h1>
          <p className="hero-subtitle" data-landing-entrance="1">
            {t('subtitle')}
          </p>
          <div className="hero-actions" data-landing-entrance="2">
            <Link
              href="/register"
              className={buttonStyles({ variant: 'landing', className: 'landing-small' })}
            >
              {t('start')}
            </Link>
            <Link
              href="#how-it-works"
              className={buttonStyles({
                variant: 'landingOutline',
                className: 'landing-small landing-how',
              })}
            >
              {t('how')}
            </Link>
          </div>
          <form
            action="#scholarships"
            className="hero-search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = new FormData(event.currentTarget).get('search')?.toString() ?? '';
              onSearch(query);
            }}
          >
            <label className="hero-search-input">
              <DesignAsset name="2006-354-imgSearch" />
              <input
                name="search"
                type="search"
                aria-label={t('placeholder')}
                placeholder={t('placeholder')}
              />
            </label>
            <button type="submit">{t('search')}</button>
          </form>
          <div className="hero-quick">
            <span>{t('quick')}</span>
            <div>
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    onSearch(filter);
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
        <HeroArtwork />
      </Container>
    </section>
  );
}
