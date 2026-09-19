import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, buttonStyles } from '@/components/ui/Button';

export function ManualScholarshipFormActions({ isPending }: { isPending: boolean }) {
  const t = useTranslations('AdminManualScholarship');

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[#e2e8f0] pt-6">
      <Button type="submit" isLoading={isPending} aria-busy={isPending} className="min-w-36">
        {isPending ? t('actions.submitting') : t('actions.submit')}
      </Button>
      <Link
        href="/admin/dashboard"
        className={buttonStyles({ variant: 'secondary', className: 'min-w-32 px-6' })}
      >
        {t('actions.cancel')}
      </Link>
    </div>
  );
}
