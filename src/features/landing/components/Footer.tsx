import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { Logo } from '@/components/shared/Logo';

const COLUMN_KEYS = ['brand', 'discover', 'tools', 'platform'] as const;

interface FooterColumn {
  title: string;
  links: string[];
}

export function Footer() {
  const t = useTranslations('Landing.footer');

  return (
    <footer className="bg-[var(--color-navy-950)] pb-6 pt-14">
      <Container className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMN_KEYS.map((key) => {
            if (key === 'brand') {
              return (
                <div key={key} className="col-span-2 flex flex-col gap-3.5 sm:col-span-1">
                  <Logo variant="light" />
                  <p className="max-w-xs text-sm leading-relaxed text-[var(--color-gray-300)]">
                    {t('brandDescription')}
                  </p>
                </div>
              );
            }

            const column = t.raw(`columns.${key}`) as FooterColumn;
            return (
              <div key={key} className="flex flex-col gap-3">
                <p className="text-sm font-bold text-white">{column.title}</p>
                {column.links.map((link) => (
                  <p key={link} className="text-sm text-[var(--color-gray-400)]">
                    {link}
                  </p>
                ))}
              </div>
            );
          })}
        </div>

        <hr className="border-t border-white/10" />

        <div className="flex flex-col-reverse items-center gap-4 py-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-[var(--color-gray-300)]">{t('copyright')}</p>
        </div>
      </Container>
    </footer>
  );
}
