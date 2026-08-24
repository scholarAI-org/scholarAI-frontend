import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/shared/Container';
import { Logo } from '@/components/shared/Logo';
import { GithubIcon, LinkedinIcon } from '@/components/icons';

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
                  <Link
                    key={link}
                    href="#"
                    className="text-sm text-[var(--color-gray-400)] transition-colors hover:text-white"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>

        <hr className="border-t border-white/10" />

        <div className="flex flex-col-reverse items-center gap-4 py-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-[var(--color-gray-300)]">{t('copyright')}</p>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-green-600)] transition-opacity hover:opacity-80"
            >
              <GithubIcon className="h-4 w-4 text-white" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-green-600)] transition-opacity hover:opacity-80"
            >
              <LinkedinIcon className="h-4 w-4 text-white" />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
