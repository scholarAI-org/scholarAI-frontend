import { useTranslations } from 'next-intl';
import { DesignAsset } from './DesignAsset';

export function HeroArtwork() {
  const t = useTranslations('Landing.updated.hero');
  return (
    <div className="hero-artwork" data-landing-entrance="1">
      <div className="hero-photo">
        <DesignAsset name="2006-354-imgGeminiGeneratedImageHkn13Ehkn13Ehkn11" alt={t('imageAlt')} />
      </div>
    </div>
  );
}
