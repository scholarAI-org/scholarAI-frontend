import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  /** الصورة الباهتة (عتمة 20%) اللي بتغطي كل اللوح الكحلي — تختلف حسب الصفحة */
  backgroundImage: string;
  /** عنوان اللوح (h2) — كل صفحة بتبني الـ <br/>/الكلمة الملوّنة حسب نصها الخاص */
  heroTitle: ReactNode;
  heroSubtitle: string;
  /** منطقة الصورة/الـ CTA تحت العنوان — تختلف تركيبتها بالكامل بين الصفحات */
  visual: ReactNode;
  /** صف اختياري تحت منطقة الصورة (مثلاً شعارات الجهات الداعمة بصفحة اللوجن فقط) */
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthLayout({
  backgroundImage,
  heroTitle,
  heroSubtitle,
  visual,
  footer,
  children,
}: AuthLayoutProps) {
  const t = useTranslations('AuthLayout');

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-[var(--color-bg-panel-brand)] lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Image src={backgroundImage} alt="" fill className="object-cover opacity-20" />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-panel-overlay)' }} />

        <div className="relative z-10 flex items-start justify-start gap-2">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image
              src="/images/logo-icon.png"
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-end">
            <p className="text-lg font-bold text-white">PsScholar</p>
            <p className="text-xs text-[var(--color-primary)]">{t('logoSubtitle')}</p>
          </div>
        </div>

        <div className="relative z-10 text-end">
          <h2 className="text-[28px] font-bold leading-tight text-white">{heroTitle}</h2>
          <p className="mt-3 text-sm leading-[22px] text-white/80">{heroSubtitle}</p>
        </div>

        <div className="relative z-10 mt-8">{visual}</div>

        {footer && (
          <div className="relative z-10 mt-6 flex items-center justify-start gap-2">{footer}</div>
        )}
      </div>
      {/* جهة الفورم */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 py-12 lg:w-1/2">
        {children}
      </div>
    </div>
  );
}
