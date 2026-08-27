import Image from 'next/image';
import { useTranslations } from 'next-intl';

/** منطقة الصورة/الشارة بلوح صفحة التسجيل — صورة واحدة كبيرة + شارة "مجاناً / انشاء حساب" فقط */
export function RegisterPanelVisual() {
  const t = useTranslations('Register');

  return (
    <div className="relative h-80">
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <Image src="/images/register-graduates.png" alt="" fill className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0) 50%, rgb(from var(--color-navy-900) r g b / 85%) 100%)',
          }}
        />
      </div>
      <div className="absolute bottom-4 end-4 flex h-14 items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 text-white shadow-[var(--shadow-badge-green)]">
        <span className="text-xs font-normal">{t('ctaCreateAccount')}</span>
        <span className="text-xl font-bold">{t('ctaFree')}</span>
      </div>
    </div>
  );
}
