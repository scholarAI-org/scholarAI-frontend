'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonStyles } from '@/components/ui/Button';
import { DesignAsset } from './DesignAsset';
import type { landingAssets } from '../assets';

export interface ScholarshipCardData {
  title: string;
  country: string;
  level: string;
  deadline: string;
  image: keyof typeof landingAssets;
  imageClass?: string;
  index?: number;
}

export function ScholarshipCard({
  title,
  country,
  level,
  deadline,
  image,
  imageClass,
  index = 0,
}: ScholarshipCardData) {
  const t = useTranslations('Landing.updated.featured');
  const [saved, setSaved] = useState(false);
  return (
    <article className="landing-scholarship-card" data-landing-reveal={index}>
      <div className={['scholarship-image', imageClass].filter(Boolean).join(' ')}>
        <DesignAsset name={image} alt={country} />
        <span className="scholarship-image-overlay" />
      </div>
      <button
        type="button"
        className="scholarship-save"
        aria-label={saved ? t('saved') : t('save')}
        aria-pressed={saved}
        onClick={() => setSaved(!saved)}
      >
        <DesignAsset name="2019-1057-imgBookmark1" />
      </button>
      <div className="scholarship-content">
        <div className="scholarship-badges">
          <span>{t('funding')}</span>
          <span>{t('match')}</span>
        </div>
        <h3>{title}</h3>
        <div className="scholarship-metadata">
          <p>
            <DesignAsset name="2019-1057-imgLocation" />
            {country}
          </p>
          <p>
            <DesignAsset name="2019-1057-imgMageBook" />
            {level}
          </p>
        </div>
        <div className="scholarship-rule">
          <DesignAsset name="2019-1057-imgLine" />
        </div>
        <div className="scholarship-bottom">
          <p>{deadline}</p>
          <Link
            href="/login"
            className={buttonStyles({ variant: 'landing', className: 'scholarship-details' })}
          >
            {t('details')}
          </Link>
        </div>
      </div>
    </article>
  );
}
