import Image from 'next/image';
import { useTranslations } from 'next-intl';

/** منطقة الصورة/الشارة بلوح صفحة اللوجن — الصورة الرئيسية + صورتين عائمتين + شارة "+100" */
export function LoginPanelVisual() {
  const t = useTranslations('AuthLayout');

  return (
    <div className="relative h-72" dir="ltr">
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <Image src="/images/auth-graduates.png" alt="" fill className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0) 55%, rgb(from var(--color-navy-900) r g b / 80%) 100%)',
          }}
        />
      </div>
      <div className="absolute end-4 -top-6 h-[143px] w-[111px] overflow-hidden rounded-[var(--radius-panel-card)] border-2 border-white/20 shadow-lg">
        <Image src="/images/auth-portrait-1.png" alt="" fill className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgb(from var(--color-navy-900) r g b / 85%) 100%)',
          }}
        />
      </div>
      <div className="absolute start-4 -bottom-6 h-[95px] w-[143px] overflow-hidden rounded-[var(--radius-panel-card)] border-2 border-[var(--color-primary)]/35 shadow-lg">
        <Image src="/images/auth-portrait-2.png" alt="" fill className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgb(from var(--color-navy-900) r g b / 70%) 0%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
      </div>
      <div className="absolute bottom-4 end-4 flex h-[52px] items-center gap-1 rounded-2xl bg-[var(--color-primary)] px-4 text-white shadow-[var(--shadow-badge-green)]">
        <span className="text-xl font-bold">+100</span>
        <span className="text-xs font-normal">{t('badgeText')}</span>
      </div>
    </div>
  );
}
