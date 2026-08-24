import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/shared/Container';
import { Reveal } from '@/components/shared/Reveal';
import { buttonStyles } from '@/components/ui/Button';

export function CtaBand() {
  const t = useTranslations('Landing.cta');

  return (
    <section className="bg-[var(--color-navy-800)] py-16 sm:py-20">
      <Container className="flex flex-col items-center gap-10 text-center">
        <Reveal className="flex flex-col items-center gap-6">
          <h2 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-[var(--color-gray-300)]">
            {t('subtitle')}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className={buttonStyles({ variant: 'primary', className: 'px-8' })}
          >
            {t('register')}
          </Link>
          <Link
            href="/login"
            className={buttonStyles({ variant: 'outline', className: 'px-8 text-white' })}
          >
            {t('login')}
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
