import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';

const STAT_KEYS = ['scholarships', 'students', 'countries', 'satisfaction'] as const;

export function StatsRow() {
  const t = useTranslations('Landing.stats');

  return (
    <Container className="py-10">
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-stretch sm:justify-between">
        {STAT_KEYS.map((key, index) => (
          <div key={key} className="flex items-center gap-8">
            {index > 0 && (
              <span className="hidden h-10 w-px bg-[var(--color-border-default)] sm:block" />
            )}
            <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-start">
              <span className="text-3xl font-extrabold text-[var(--color-navy-800)] sm:text-4xl">
                {t(`${key}.value`)}
              </span>
              <span className="text-sm text-[var(--color-gray-500)]">{t(`${key}.label`)}</span>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
