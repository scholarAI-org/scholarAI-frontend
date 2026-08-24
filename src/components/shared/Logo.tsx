import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface LogoProps {
  variant?: 'dark' | 'light';
}

export function Logo({ variant = 'dark' }: LogoProps) {
  const t = useTranslations('Landing.brand');

  return (
    <div className="flex items-center gap-2">
      <div className="text-end">
        <p
          className={
            variant === 'light'
              ? 'text-[17px] font-bold leading-[1.5] text-white'
              : 'text-[17px] font-bold leading-[1.5] text-[var(--color-navy-800)]'
          }
        >
          {t('name')}
        </p>
        <p className="text-[11px] leading-[1.5] text-[var(--color-primary)]">{t('tagline')}</p>
      </div>
      <div className="h-11 w-[46px] shrink-0 overflow-hidden rounded-full">
        <Image
          src="/images/logo-icon.png"
          alt={t('name')}
          width={46}
          height={44}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
