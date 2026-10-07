import { useTranslations } from 'next-intl';
import { DesignAsset } from './DesignAsset';

export function HeroArtwork() {
  const t = useTranslations('Landing.updated.hero');
  return (
    <div className="hero-artwork" data-landing-entrance="1">
      <div className="hero-photo">
        <DesignAsset name="2006-354-imgGeminiGeneratedImageHkn13Ehkn13Ehkn11" alt={t('imageAlt')} />
      </div>
      <div className="hero-accepted">
        <span>
          <DesignAsset name="2006-354-imgCheckIcon" />
        </span>
        <div>
          <small>{t('accepted')}</small>
          <p>{t('award')}</p>
        </div>
      </div>
      <div className="hero-stat hero-universities">
        <div>
          <strong>20</strong>
          <small>{t('universities')}</small>
        </div>
        <span>
          <DesignAsset name="2006-354-imgMaterialSymbolsLightHomeWorkOutlineRounded" />
        </span>
      </div>
      <div className="hero-notice hero-notification">
        <span>{t('notification')}</span>
        <DesignAsset name="2006-354-imgClarityNotificationLine" />
      </div>
      <div className="hero-notice hero-recommendation">
        <span>{t('recommendations')}</span>
        <DesignAsset name="2006-354-imgVector" />
      </div>
      <div className="hero-stat hero-students">
        <div>
          <strong>1241</strong>
          <small>{t('students')}</small>
        </div>
        <span>
          <DesignAsset name="2006-354-imgBiPeople" />
        </span>
      </div>
      <div className="hero-stat hero-scholarships">
        <div>
          <strong dir="ltr">+250</strong>
          <small>{t('scholarships')}</small>
        </div>
        <span>
          <DesignAsset name="2006-354-imgGroup" />
        </span>
      </div>
      <div className="hero-notice hero-recommendation-green">
        <span>{t('recommendations')}</span>
        <DesignAsset name="2006-354-imgVector1" />
      </div>
    </div>
  );
}
