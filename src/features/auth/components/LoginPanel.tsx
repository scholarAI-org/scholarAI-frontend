import Image from 'next/image';
import { useTranslations } from 'next-intl';

/** منطقة الصورة/الشارة بلوح صفحة اللوجن — الصورة الرئيسية + صورتين عائمتين + شارة "+100" */
export function LoginPanelVisual() {
  const t = useTranslations('AuthLayout');

  return (
    <div className="relative h-72">
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
      <div className="absolute end-4 -top-6 h-[143px] w-[111px] overflow-hidden rounded-xl border border-white/20 shadow-lg">
        <Image src="/images/auth-portrait-1.png" alt="" fill className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgb(from var(--color-navy-900) r g b / 85%) 100%)',
          }}
        />
      </div>
      <div className="absolute start-4 -bottom-6 h-[95px] w-[143px] overflow-hidden rounded-xl border border-[var(--color-primary)]/35 shadow-lg">
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

/** صف شعارات الجهات الداعمة أسفل لوح صفحة اللوجن — خاص بها فقط، مش موجود بصفحة التسجيل */
export function LoginPanelFooter() {
  const t = useTranslations('AuthLayout');

  return (
    <>
      <span className="text-[11px] text-white/35">{t('supportedBy')}</span>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/[0.07] px-[11px] py-[4px] text-[11px] text-white/60">
          {t('partnerPlo')}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.07] px-[11px] py-[4px] text-[11px] text-white/60">
          {t('partnerUnrwa')}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.07] px-[11px] py-[4px] text-[11px] text-white/60">
          {t('partnerMinistry')}
        </span>
      </div>
    </>
  );
}
