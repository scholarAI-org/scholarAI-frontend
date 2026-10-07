import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { BrainIcon, DocumentIcon, NotificationIcon, SearchIcon } from '@/components/icons';

const icons = [SearchIcon, BrainIcon, DocumentIcon, NotificationIcon];
export function PlatformFeatures() {
  const t = useTranslations('Landing.platformFeatures');
  const items = t.raw('items') as { title: string; description: string }[];
  return (
    <section id="features" className="bg-white py-16 sm:py-20">
      <Container>
        <div className="mb-10 text-center">
          <p className="text-sm font-bold text-[var(--color-primary)]">{t('badge')}</p>
          <h2 className="mt-3 text-2xl font-bold text-[var(--color-navy-800)] sm:text-3xl">
            {t('heading')}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => {
            const Icon = icons[i];
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-page)] p-5"
              >
                <Icon className="mb-5 h-6 w-6 text-[var(--color-primary)]" />
                <h3 className="font-bold text-[var(--color-navy-800)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
