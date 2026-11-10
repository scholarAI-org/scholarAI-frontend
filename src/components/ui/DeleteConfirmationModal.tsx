'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from './Button';

export type DeleteEntityType = 'language' | 'experience' | 'skill' | 'document';

interface DeleteConfirmationModalProps {
  open: boolean;
  entityType: DeleteEntityType;
  itemName: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
}

const emptySubscribe = () => () => undefined;

export function DeleteConfirmationModal({
  open,
  entityType,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const t = useTranslations('DeleteConfirmation');
  const locale = useLocale();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a2243]/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div
        className="flex w-full max-w-[400px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl relative"
        // Portalled to <body>, outside the locale wrapper, so the direction is set here.
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        lang={locale}
      >
        <div className="flex flex-col items-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" strokeWidth={2} />
          </div>

          <h3 className="mb-3 text-[22px] font-bold text-[#1e293b]">{t(`titles.${entityType}`)}</h3>

          <p className="mb-6 text-[15px] leading-relaxed text-[#64748b]">
            {t.rich(`descriptions.${entityType}`, {
              name: itemName,
              br: () => <br />,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>

          <div className="mb-8 w-full rounded-2xl bg-red-50 py-3 text-center text-[14px] font-medium text-red-600 border border-red-100">
            {t('irreversible')}
          </div>

          <div className="flex w-full items-center gap-3">
            <Button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 h-[48px] rounded-[24px] bg-[#E2E8F0] text-[#64748b] font-bold hover:bg-[#cbd5e1] border-none shadow-none"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={onConfirm}
              isLoading={isDeleting}
              className="flex-1 h-[48px] rounded-[24px] bg-[#F07A7A] text-white font-bold hover:bg-red-500 border-none shadow-none"
            >
              {t('confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
