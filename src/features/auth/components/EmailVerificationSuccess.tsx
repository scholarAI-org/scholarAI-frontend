import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { buttonStyles } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { EmailVerificationLayout } from './EmailVerificationLayout';

export function EmailVerificationSuccess() {
  const t = useTranslations('EmailVerificationSuccess');

  return (
    <EmailVerificationLayout backHref="/login">
      <section className="py-12 text-center">
        <Image
          src="/images/email-verified.svg"
          alt=""
          width={158}
          height={158}
          className="mx-auto size-[158px]"
          priority
        />
        <h1 className="mt-6 text-2xl font-bold text-[var(--color-text-primary)]">{t('title')}</h1>
        <p className="mt-2 text-sm leading-[22px] text-[var(--color-text-secondary)]">
          {t('description')}
        </p>
        <Link href="/login" className={buttonStyles({ className: 'mt-6 w-full rounded-full' })}>
          {t('continue')}
        </Link>
      </section>
    </EmailVerificationLayout>
  );
}
