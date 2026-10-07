import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';

export function StatsRow() {
  const t = useTranslations('Landing.trust');

  return (
    <section id="about" className="bg-white">
      <Container className="py-14">
        <div className="mb-7 text-center">
          <p className="text-sm font-bold text-[var(--color-primary)]">{t('badge')}</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--color-navy-800)]">{t('heading')}</h2>
        </div>
        <div className="grid gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-6 text-center sm:grid-cols-3">
          {(['discover', 'guidance', 'tracking'] as const).map((key) => (
            <p key={key} className="text-sm font-bold text-[var(--color-navy-800)]">
              {t(key)}
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}
